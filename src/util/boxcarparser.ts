/* eslint-disable no-case-declarations */
/* eslint-disable prefer-const */
/* eslint-disable no-constant-condition */
const { BitStream } = window.require("bit-buffer");
const fs = window.require("fs");
type BitStream = typeof BitStream;
function _arch_to_class(archname: string): string {
  let classname: string;

  if (
    [
      "GameInfo_Soccar.GameInfo.GameInfo_Soccar:GameReplicationInfoArchetype",
      "GameInfo_Season.GameInfo.GameInfo_Season:GameReplicationInfoArchetype",
      "GameInfo_Basketball.GameInfo.GameInfo_Basketball:GameReplicationInfoArchetype",
    ].includes(archname)
  ) {
    classname = "TAGame.GRI_TA";
  } else if (
    archname === "Archetypes.GameEvent.GameEvent_Season:CarArchetype"
  ) {
    classname = "TAGame.Car_Season_TA";
  } else if (
    [
      "Archetypes.GameEvent.GameEvent_Basketball",
      "Archetypes.GameEvent.GameEvent_BasketballPrivate",
    ].includes(archname)
  ) {
    classname = "TAGame.GameEvent_Soccar_TA";
  } else if (
    archname === "Archetypes.GameEvent.GameEvent_BasketballSplitscreen"
  ) {
    classname = "TAGame.GameEvent_SoccarSplitscreen_TA";
  } else if (
    [
      "Archetypes.Ball.CubeBall",
      "Archetypes.Ball.Ball_Puck",
      "Archetypes.Ball.Ball_Basketball",
    ].includes(archname)
  ) {
    classname = "TAGame.Ball_TA";
  } else {
    classname = archname
      .replace(/_\d+/g, "")
      .split(".")
      .slice(-1)[0]
      .split(":")
      .slice(-1)[0];
    classname = classname
      .replace("_Default", "_TA")
      .replace("Archetype", "")
      .replace("_0", "")
      .replace("0", "_TA")
      .replace("1", "_TA")
      .replace("Default__", "");
    classname = "." + classname;
  }

  return classname;
}
const reverseByte = (x: number): number => {
  x = ((x & 0x55) << 1) | ((x & 0xaa) >> 1);
  x = ((x & 0x33) << 2) | ((x & 0xcc) >> 2);
  x = ((x & 0x0f) << 4) | ((x & 0xf0) >> 4);
  return x;
};
const reverseBytewise = (bitStream: BitStream) => {
  const result = [];

  // Convert bitStream to byte array
  for (let i = 0; i < 4; i++) {
    const byte = bitStream.readUint8();
    result.push(reverseByte(byte));
  }

  return new Uint8Array(result);
};

const _read_int = (bitStream: BitStream) => {
  // Read 32 bits from the bitStream and reverse the bytes
  const reversedBytes = reverseBytewise(bitStream);

  // Create a DataView to interpret the reversed bytes as a little-endian integer
  const dataView = new DataView(reversedBytes.buffer);
  return dataView.getInt32(0, true); // true indicates little-endian
};
module.exports.readReplayMf = () => {
  fs.readFile(
    "D:\\Documents\\My Games\\Rocket League\\TAGame\\Demos\\8075AEC640E0BB9073014B9F1C23563A.replay",
    (err: any, data: any) => {
      if (err) throw err;

      const bitStream = new BitStream(data);

      const readBitsSafely = (bitStream: BitStream, bits: number): number => {
        if (bitStream.bitsLeft < bits) {
          throw new Error("Not enough bits left to read");
        }
        return bitStream.readBits(bits);
      };

      const readInt32Safely = (bitStream: BitStream): number => {
        if (bitStream.bitsLeft < 32) {
          throw new Error("Not enough bits left to read");
        }
        return bitStream.readInt32();
      };
      const readInt64Safely = (bitStream: BitStream): [number, number] => {
        if (bitStream.bitsLeft < 64) {
          throw new Error("Not enough bits left to read");
        }
        const low = readUint32Safely(bitStream);
        const high = readInt32Safely(bitStream);
        return [high, low];
      };
      const readUint32Safely = (bitStream: BitStream): number => {
        if (bitStream.bitsLeft < 32) {
          throw new Error("Not enough bits left to read");
        }
        return bitStream.readUint32();
      };

      const readFloat32Safely = (bitStream: BitStream): number => {
        if (bitStream.bitsLeft < 32) {
          throw new Error("Not enough bits left to read");
        }
        return bitStream.readFloat32();
      };

      const readUTF8StringSafely = (
        bitStream: BitStream,
        size: number
      ): string => {
        if (bitStream.bitsLeft < size * 8) {
          throw new Error("Not enough bits left to read");
        }
        return bitStream.readUTF8String(size);
      };

      const readUTF16StringSafely = (
        bitStream: BitStream,
        size: number
      ): string => {
        if (bitStream.bitsLeft < size * 8) {
          throw new Error("Not enough bits left to read");
        }
        return bitStream.readUTF16String(size);
      };
      const bitWidth = (input: number): number => {
        // Check if the input is within the bounds of a 64-bit unsigned integer
        if (input < 0 || input > Number.MAX_SAFE_INTEGER) {
          throw new Error(
            "Input must be a non-negative integer within the range of a 64-bit unsigned integer."
          );
        }

        // Number.MAX_SAFE_INTEGER is 2^53 - 1, which is the maximum safe integer in JavaScript
        // This check ensures compatibility with 64-bit numbers

        // Calculate the bit width
        return (
          64 -
          Math.clz32(Math.floor(input / Math.pow(2, 32))) -
          Math.clz32(input & 0xffffffff)
        );
      };
      const peekBitsMaxComputed = (bits: number, max: number): number => {
        const debugAssert = (condition: boolean, message: string) => {
          if (!condition) {
            throw new Error(message);
          }
        };

        debugAssert(
          Math.max(bitWidth(max), 1) === bits + 1,
          "Assertion failed: max bit width and bits + 1 do not match"
        );

        const data = readBitsSafely(bitStream, bits);
        const up = data + (1 << bits);
        if (up >= max) {
          return data;
        } else if (readBitsSafely(bitStream, 1) !== 0) {
          return up;
        } else {
          return data;
        }
      };
      const parseProperties = (bitStream: BitStream): any => {
        const properties: any = {};

        while (true) {
          let keySize = readInt32Safely(bitStream);

          if (keySize === 0) break; // End of properties
          if (keySize < 0 || keySize > 1000) {
            throw new Error(`Invalid key size: ${keySize}`);
          }

          const key = readUTF8StringSafely(bitStream, keySize - 1);

          bitStream.index += 8; // Skip null character

          if (key === "None") {
            break;
          }

          const valueTypeSize = readInt32Safely(bitStream);
          if (valueTypeSize < 0 || valueTypeSize > 1000) {
            throw new Error(`Invalid value type size: ${valueTypeSize}`);
          }

          const valueType = readUTF8StringSafely(bitStream, valueTypeSize - 1);

          bitStream.index += 8; // Skip null character

          bitStream.index += 64; // Skip 8 bytes

          let value;
          switch (valueType) {
            case "BoolProperty":
              value = readBitsSafely(bitStream, 8);
              break;
            case "ByteProperty":
              const enumNameSize = readInt32Safely(bitStream);
              const enumName = readUTF8StringSafely(
                bitStream,
                enumNameSize - 1
              );
              bitStream.index += 8; // Skip null character

              const enumValueSize = readInt32Safely(bitStream);
              const enumValue = readUTF8StringSafely(
                bitStream,
                enumValueSize - 1
              );
              bitStream.index += 8; // Skip null character

              value = { enumName, enumValue };
              break;
              break;
            case "FloatProperty":
              value = readFloat32Safely(bitStream);
              break;
            case "IntProperty":
              value = readInt32Safely(bitStream);
              break;
            case "NameProperty":
            case "StrProperty":
              const strSize = readInt32Safely(bitStream);
              value = readUTF8StringSafely(bitStream, strSize - 1);
              bitStream.index += 8; // Skip null character
              break;
            case "QWordProperty":
              value = readInt64Safely(bitStream);
              break;
            case "ArrayProperty":
              value = [];
              const arrayElementSize = readInt32Safely(bitStream);
              let iteration = 0;
              while (true) {
                iteration++;
                const arrayElement = parseProperties(bitStream);
                value.push(arrayElement);
                if (iteration === arrayElementSize) break;
              }
              break;
            default:
              throw new Error(`Unknown property type: ${valueType}`);
          }
          properties[key] = value;
        }
        console.log("PROPS", properties);
        return properties;
      };

      try {
        // Parse Header
        const headerSize = readUint32Safely(bitStream);
        const headerCRC = readUint32Safely(bitStream);
        const majorVersion = readUint32Safely(bitStream);
        const minorVersion = readUint32Safely(bitStream);
        const networkVersion = readUint32Safely(bitStream);

        const gameTypeSize = readInt32Safely(bitStream);
        let gameType = "";
        if (gameTypeSize > 0) {
          gameType = readUTF8StringSafely(bitStream, gameTypeSize - 1);
          bitStream.index += 8; // Skip 8 bits (1 byte) for null character
        } else if (gameTypeSize < 0) {
          const utf16Size = -gameTypeSize * 2;
          gameType = readUTF16StringSafely(bitStream, utf16Size - 2);
          bitStream.index += 16; // Skip 16 bits (2 bytes) for null character
        }

        const headerProperties = parseProperties(bitStream);

        // Parse Body
        const bodySize = readInt32Safely(bitStream);
        console.log("bodySize:", bodySize, bitStream.bitsLeft);
        const bodyCRC = readInt32Safely(bitStream);
        console.log("bodyCRC:", bodyCRC, bitStream.bitsLeft);

        const levelCount = readInt32Safely(bitStream);
        console.log(
          "🚀Fran ~ file: boxcarparser.ts:187 ~ levelCount:",
          levelCount,
          bitStream.bitsLeft
        );
        for (let i = 0; i < levelCount; i++) {
          const levelSize = readInt32Safely(bitStream);
          const level = readUTF8StringSafely(bitStream, levelSize - 1);
          bitStream.index += 8; // Skip null character
        }
        console.log("Parsing Keyframes...");
        const keyframeCount = readInt32Safely(bitStream);
        console.log("Keyframe Count:", keyframeCount);
        for (let i = 0; i < keyframeCount; i++) {
          const time = readFloat32Safely(bitStream);
          const frame = readInt32Safely(bitStream);
          const position = readInt32Safely(bitStream);
          console.log(
            "Keyframe - Time:",
            time,
            "Frame:",
            frame,
            "Position:",
            position
          );
        }

        const networkDataSize = readUint32Safely(bitStream);
        console.log(
          "🚀Fran ~ file: boxcarparser.ts:215 ~ networkDataSize:",
          networkDataSize
        );
        // bitStream.index += networkDataSize * 8; // Skip network data
        // Retrieve NumFrames from header properties
        const numFrames = headerProperties["NumFrames"];
        if (numFrames === undefined) {
          throw new Error("NumFrames not found in header properties");
        }
        console.log("Number of Frames:", numFrames);

        const numChannels = headerProperties["MaxChannels"];
        if (numChannels === undefined) {
          throw new Error("NumChannels not found in header properties");
        }
        console.log("Number of Channels:", numChannels);

        // Parse each frame
        for (let i = 0; i < numFrames; i++) {
          // Read the absolute time and delta for each frame
          const absoluteTime = bitStream.readFloat32();
          const deltaTime = bitStream.readFloat32();
          console.log(
            `Frame ${i} - Absolute Time:`,
            absoluteTime,
            `Delta Time:`,
            deltaTime
          );
          if (Number(absoluteTime) < 0) {
            throw new Error("Absolute time is out of wack");
          }
          if (deltaTime < 0 || deltaTime > 1e-10) {
            throw new Error("Delta time is out of wack");
          }
          // Decode actor data
          while (readBitsSafely(bitStream, 1)) {
            // While there is more actor data (bit is on)
            const actorId = readBitsSafely(
              bitStream,
              Math.ceil(Math.log2(numChannels))
            ); // Number of bits needed to represent "NumChannels"
            console.log(`Actor ID: ${actorId}`);

            if (readBitsSafely(bitStream, 1)) {
              // If actor is alive (bit is on)
              if (readBitsSafely(bitStream, 1)) {
                // If actor is new (bit is on)
                // Parse new actor
                const nameIndex = readInt32Safely(bitStream); // 32-bit integer representing the index in the `names` list
                const unusedBit = readBitsSafely(bitStream, 1); // Unused bit
                const objectId = readInt32Safely(bitStream); // 32-bit integer representing the ObjectId
                if (i === 0) {
                  console.log(
                    `New Actor id: ${actorId} - Name Index: ${nameIndex}, ObjectId: ${objectId}`
                  );
                }

                // HERE's where i might be missing something
                // Decode initial position if available
                const isInitPosAvailable = readBitsSafely(bitStream, 1);
                if (isInitPosAvailable) {
                  const sizeBits = readBitsSafely(bitStream, 5);
                  const bias = 2 ** (sizeBits + 1);
                  const bitLimit = sizeBits + 2;
                  const positionX = readBitsSafely(bitStream, bitLimit - bias);
                  const positionY = readBitsSafely(bitStream, bitLimit - bias);
                  const positionZ = readBitsSafely(bitStream, bitLimit - bias);
                  if (i === 0) {
                    console.log(
                      `fran Initial Position - X: ${positionX}, Y: ${positionY}, Z: ${positionZ}`
                    );
                  }
                }

                // Decode initial rotation if available
                if (readBitsSafely(bitStream, 1)) {
                  const yaw = bitStream.readInt8(); // signed 8 bits
                  const pitch = bitStream.readInt8(); // signed 8 bits
                  const roll = bitStream.readInt8(); // signed 8 bits
                  if (i === 0) {
                    console.log(
                      `fran Initial Rotation - Yaw: ${yaw}, Pitch: ${pitch}, Roll: ${roll}`
                    );
                  }
                }
              } else {
                // Update existing actor with new attribute
                while (readBitsSafely(bitStream, 1)) {
                  // While the next bit is on, there are more attributes
                  const streamIdSize = readInt32Safely(bitStream);
                  const streamId = readBitsSafely(bitStream, streamIdSize); // Number of bits to represent attribute stream id
                  const attributeValue = readInt32Safely(bitStream); // Example read for attribute value
                  console.log(
                    `Attribute - Stream ID: ${streamId}, Value: ${attributeValue}`
                  );
                }
              }
              console.log(
                "🚀Fran ~ file: boxcarparser.ts:377 ~ _read_int(bitStream):",
                _read_int(bitStream)
              );
            } else {
              // Actor is deleted
              console.log(`Actor ${actorId} deleted`);
            }
          }
        }

        // Parse Footer
        const debugInfoCount = readInt32Safely(bitStream);
        console.log(
          "🚀Fran ~ file: boxcarparser.ts:220 ~ debugInfoCount:",
          debugInfoCount
        );
        for (let i = 0; i < debugInfoCount; i++) {
          const frame = readInt32Safely(bitStream);
          const userSize = readInt32Safely(bitStream);
          const user = readUTF8StringSafely(bitStream, userSize - 1);
          bitStream.index += 8; // Skip null character
          const textSize = readInt32Safely(bitStream);
          const text = readUTF8StringSafely(bitStream, textSize - 1);
          bitStream.index += 8; // Skip null character
        }

        const tickmarkCount = readInt32Safely(bitStream);
        for (let i = 0; i < tickmarkCount; i++) {
          const descriptionSize = readInt32Safely(bitStream);
          const description = readUTF8StringSafely(
            bitStream,
            descriptionSize - 1
          );
          bitStream.index += 8; // Skip null character
          const frame = readInt32Safely(bitStream);
        }

        const packageCount = readInt32Safely(bitStream);
        console.log("Package Count:", packageCount);
        for (let i = 0; i < packageCount; i++) {
          const packageSize = readInt32Safely(bitStream);
          const packageItem = readUTF8StringSafely(bitStream, packageSize - 1);
          bitStream.index += 8; // Skip null character
          console.log(`Package ${i}:`, packageItem);
        }

        // Parse Objects (list of strings)
        const objectCount = readInt32Safely(bitStream);
        console.log("Object Count:", objectCount);
        for (let i = 0; i < objectCount; i++) {
          const objectSize = readInt32Safely(bitStream);
          const objectItem = readUTF8StringSafely(bitStream, objectSize - 1);
          bitStream.index += 8; // Skip null character
          console.log(`Object ${i}:`, objectItem);
        }

        // Parse Names (list of strings)
        const nameCount = readInt32Safely(bitStream);
        console.log("Name Count:", nameCount);
        for (let i = 0; i < nameCount; i++) {
          const nameSize = readInt32Safely(bitStream);
          const nameItem = readUTF8StringSafely(bitStream, nameSize - 1);
          bitStream.index += 8; // Skip null character
          console.log(`Name ${i}:`, nameItem);
        }

        // Parse Class Indices (class: string, index: 32 bit integer)
        const classIndexCount = readInt32Safely(bitStream);
        console.log("Class Index Count:", classIndexCount);
        for (let i = 0; i < classIndexCount; i++) {
          const classSize = readInt32Safely(bitStream);
          const className = readUTF8StringSafely(bitStream, classSize - 1);
          bitStream.index += 8; // Skip null character
          const classIndex = readInt32Safely(bitStream);
          console.log(
            `Class Index ${i} - Class: ${className}, Index: ${classIndex}`
          );
        }

        // Parse Network Attribute Encodings
        const networkAttributeEncodingCount = readInt32Safely(bitStream);
        console.log(
          "Network Attribute Encoding Count:",
          networkAttributeEncodingCount
        );
        for (let i = 0; i < networkAttributeEncodingCount; i++) {
          const objectInd = readInt32Safely(bitStream);
          const parentId = readInt32Safely(bitStream);
          const cacheId = readInt32Safely(bitStream);
          console.log(
            `Network Attribute Encoding ${i} - ObjectInd: ${objectInd}, ParentId: ${parentId}, CacheId: ${cacheId}`
          );

          const propertyCount = readInt32Safely(bitStream);
          console.log(`Property Count: ${propertyCount}`);
          const properties: { objectInd: number; streamId: number }[] = [];
          for (let j = 0; j < propertyCount; j++) {
            const propObjectInd = readInt32Safely(bitStream);
            const streamId = readInt32Safely(bitStream);
            properties.push({ objectInd: propObjectInd, streamId });
          }
          console.log(`Properties: ${JSON.stringify(properties)}`);
        }
        // Continue parsing Objects, Names, Class Indices, Network Attribute Encodings as per format
      } catch (error) {
        console.error("Error while parsing replay file:", error.message);
      }
    }
  );
};
