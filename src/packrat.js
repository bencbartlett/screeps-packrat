"use strict";
/**
 * screeps-packrat
 * ---------------
 * Lightning-fast and memory-efficient serialization of Screeps IDs, Coords, and RoomPositions
 * Code written by Muon as part of Overmind Screeps AI. Feel free to adapt as desired.
 * Package repository: https://github.com/bencbartlett/screeps-packrat
 * 
 * TypeScript version is available in the #share-thy-code channel on the Screeps Slack.
 *
 * To use: import desired functions from module, or import entire module on main and use functions from global.
 * To benchmark: PackratTests.run()
 *
 * Exported functions (available on global):
 *
 * +--------------------------+------------------------------------------------+-----------------+--------------------+
 * |         function         |                  description                   | execution time* | memory reduction** |
 * +--------------------------+------------------------------------------------+-----------------+--------------------+
 * | packId                   | packs a game object id into 6 chars            | 500ns           | -75%               |
 * | unpackId                 | unpacks 6 chars into original format           | 1.3us           |                    |
 * | packIdList               | packs a list of ids into a single string       | 500ns/id        | -81%               |
 * | unpackIdList             | unpacks a string into a list of ids            | 1.2us/id        |                    |
 * | packPos                  | packs a room position into 2 chars             | 150ns           | -90%               |
 * | unpackPos                | unpacks 2 chars into a room position           | 600ns           |                    |
 * | packPosList              | packs a list of room positions into a string   | 150ns/pos       | -95%               |
 * | unpackPosList            | unpacks a string into a list of room positions | 1.5us/pos       |                    |
 * | packCoord                | packs a coord (e.g. {x:25,y:25}) as a string   | 150ns           | -80%               |
 * | unpackCoord              | unpacks a string into a coord                  | 60-150ns        |                    |
 * | packCoordList            | packs a list of coords as a string             | 120ns/coord     | -94%               |
 * | unpackCoordList          | unpacks a string into a list of coords         | 100ns/coord     |                    |
 * | unpackCoordAsPos         | unpacks string + room name into a pos          | 500ns           |                    |
 * | unpackCoordListAsPosList | unpacks string + room name into a list of pos  | 500ns/coord     |                    |
 * +--------------------------+------------------------------------------------+-----------------+--------------------+
 *
 *  * Execution time measured on shard2 public servers and may vary on different machines or shards.
 * ** Memory reduction for list functions is the asymptotic limit of lists containing many entries. Lower reductions
 *    can be expected for smaller lists.
 */

Object.defineProperty(exports, "__esModule", { value: true });

global.PERMACACHE = {}; // Create a permanent cache for immutable items such as room names

/**
 * Convert a hex string to a Uint16Array.
 */
function hexToUint16Array(hex) {
	const len = Math.ceil(hex.length / 4); // four hex chars for each 16-bit value
	const array = new Uint16Array(len);
	for (let i = 0; i < hex.length; i += 4) {
		array[i >>> 2] = parseInt(hex.substr(i, 4), 16);
	}
	return array;
}

/**
 * Convert a Uint16Array to a hex string. Note that uint16ArrayToHex(hexToUint16Array('0123abce')) will
 * return '123abcde' since this does not account for zero padding. Fortunately this is not an issue for screeps, since
 * ids do not seem to be allowed to start with a 0.
 */
function uint16ArrayToHex(array) {
	const hex = [];
	let current;
	for (let i = 0; i < array.length; ++i) {
		current = array[i];
		hex.push((current >>> 8).toString(16));
		hex.push((current & 0xFF).toString(16));
	}
	return hex.join('');
}

/**
 * Convert a standard 24-character hex id in screeps to a compressed UTF-16 encoded string of length 6.
 *
 * Benchmarking: average of 500ns to execute on shard2 public server, reduce stringified size by 75%
 */
function packId(id) {
	return String.fromCharCode(parseInt(id.substr(0, 4), 16)) +
		   String.fromCharCode(parseInt(id.substr(4, 4), 16)) +
		   String.fromCharCode(parseInt(id.substr(8, 4), 16)) +
		   String.fromCharCode(parseInt(id.substr(12, 4), 16)) +
		   String.fromCharCode(parseInt(id.substr(16, 4), 16)) +
		   String.fromCharCode(parseInt(id.substr(20, 4), 16));
}

/**
 * Convert a compressed six-character UTF-encoded id back into the original 24-character format.
 *
 * Benchmarking: average of 1.3us to execute on shard2 public server
 */
function unpackId(packedId) {
	let id = '';
	let current;
	for (let i = 0; i < 6; ++i) {
		current = packedId.charCodeAt(i);
		id += (current >>> 8).toString(16).padStart(2, '0'); // String.padStart() requires es2017+ target
		id += (current & 0xFF).toString(16).padStart(2, '0');
	}
	return id;
}


/**
 * Packs a list of ids as a utf-16 string. This is better than having a list of packed coords, as it avoids
 * extra commas and "" when memroy gets stringified.
 *
 * Benchmarking: average of 500ns per id to execute on shard2 public server, reduce stringified size by 81%
 */
function packIdList(ids) {
	let str = '';
	for (let i = 0; i < ids.length; ++i) {
		str += packId(ids[i]);
	}
	return str;
}

/**
 * Unpacks a list of ids stored as a utf-16 string.
 *
 * Benchmarking: average of 1.2us per id to execute on shard2 public server.
 */
function unpackIdList(packedIds) {
	const ids = [];
	for (let i = 0; i < packedIds.length; i += 6) {
		ids.push(unpackId(packedIds.substr(i, 6)));
	}
	return ids;
}

/**
 * Packs a coord as a single utf-16 character. The seemingly strange choice of encoding value ((x << 6) | y) + 65 was
 * chosen to be fast to compute (x << 6 | y is significantly faster than 50 * x + y) and to avoid control characters,
 * as "A" starts at character code 65.
 *
 * Benchmarking: average of 150ns to execute on shard2 public server, reduce stringified size by 80%
 */
function packCoord(coord) {
	return String.fromCharCode(((coord.x << 6) | coord.y) + 65);
}

/**
 * Unpacks a coord stored as a single utf-16 character
 *
 * Benchmarking: average of 60ns-100ns to execute on shard2 public server
 */
function unpackCoord(char) {
	const xShiftedSixOrY = char.charCodeAt(0) - 65;
	return {
		x: (xShiftedSixOrY & 0b111111000000) >>> 6,
		y: (xShiftedSixOrY & 0b000000111111),
	};
}

/**
 * Unpacks a coordinate and creates a RoomPosition object from a specified roomName
 *
 * Benchmarking: average of 500ns to execute on shard2 public server
 */
function unpackCoordAsPos(packedCoord, roomName) {
	const coord = unpackCoord(packedCoord);
	return new RoomPosition(coord.x, coord.y, roomName);
}

/**
 * Packs a list of coords as a utf-16 string. This is better than having a list of packed coords, as it avoids
 * extra commas and "" when memroy gets stringified.
 *
 * Benchmarking: average of 120ns per coord to execute on shard2 public server, reduce stringified size by 94%
 */
function packCoordList(coords) {
	let str = '';
	for (let i = 0; i < coords.length; ++i) {
		str += String.fromCharCode(((coords[i].x << 6) | coords[i].y) + 65);
	}
	return str;
}

/**
 * Unpacks a list of coords stored as a utf-16 string
 *
 * Benchmarking: average of 100ns per coord to execute on shard2 public server
 */
function unpackCoordList(chars) {
	const coords = [];
	let xShiftedSixOrY;
	for (let i = 0; i < chars.length; ++i) {
		xShiftedSixOrY = chars.charCodeAt(i) - 65;
		coords.push({
						x: (xShiftedSixOrY & 0b111111000000) >>> 6,
						y: (xShiftedSixOrY & 0b000000111111),
					});
	}
	return coords;
}

/**
 * Unpacks a list of coordinates and creates a list of RoomPositions from a specified roomName
 *
 * Benchmarking: average of 500ns per coord to execute on shard2 public server
 */
function unpackCoordListAsPosList(packedCoords, roomName) {
	const positions = [];
	let coord;
	for (let i = 0; i < packedCoords.length; ++i) {
		// Each coord is saved as a single character; unpack each and insert the room name to get the positions list
		coord = unpackCoord(packedCoords[i]);
		positions.push(new RoomPosition(coord.x, coord.y, roomName));
	}
	return positions;
}

PERMACACHE._packedRoomNames = PERMACACHE._packedRoomNames || {};
PERMACACHE._unpackedRoomNames = PERMACACHE._unpackedRoomNames || {};

/**
 * Packs a roomName as a single utf-16 character. Character values are stored on permacache.
 */
function packRoomName(roomName) {
	if (PERMACACHE._packedRoomNames[roomName] === undefined) {
		const coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g;
		const match = coordinateRegex.exec(roomName);
		const xDir = match[1];
		const x = Number(match[2]);
		const yDir = match[3];
		const y = Number(match[4]);
		let quadrant;
		if (xDir == 'W') {
			if (yDir == 'N') {
				quadrant = 0;
			}
			else {
				quadrant = 1;
			}
		}
		else {
			if (yDir == 'N') {
				quadrant = 2;
			}
			else {
				quadrant = 3;
			}
		}
		// y is 6 bits, x is 6 bits, quadrant is 2 bits
		const num = (quadrant << 14 | (x << 7) | y) + 65;
		const char = String.fromCharCode(num);
		PERMACACHE._packedRoomNames[roomName] = char;
		PERMACACHE._unpackedRoomNames[char] = roomName;
	}
	return PERMACACHE._packedRoomNames[roomName];
}

/**
 * Packs a roomName as a single utf-16 character. Character values are stored on permacache.
 */
function unpackRoomName(char) {
	if (PERMACACHE._unpackedRoomNames[char] === undefined) {
		const num = char.charCodeAt(0) - 65;
		const { q, x, y } = {
			q: (num & 0b1100000001111111) >>> 14,
			x: (num & 0b0011111110000000) >>> 7,
			y: (num & 0b0000000001111111),
		};
		let roomName;
		switch (q) {
			case 0:
				roomName = 'W' + x + 'N' + y;
				break;
			case 1:
				roomName = 'W' + x + 'S' + y;
				break;
			case 2:
				roomName = 'E' + x + 'N' + y;
				break;
			case 3:
				roomName = 'E' + x + 'S' + y;
				break;
			default:
				roomName = 'ERROR';
		}
		PERMACACHE._packedRoomNames[roomName] = char;
		PERMACACHE._unpackedRoomNames[char] = roomName;
	}
	return PERMACACHE._unpackedRoomNames[char];
}

/**
 * Packs a RoomPosition as a pair utf-16 characters. The seemingly strange choice of encoding value ((x << 6) | y) + 65
 * was chosen to be fast to compute (x << 6 | y is significantly faster than 50 * x + y) and to avoid control
 * characters, as "A" starts at character code 65.
 *
 * Benchmarking: average of 150ns to execute on shard2 public server, reduce stringified size by 90%
 */
function packPos(pos) {
	return packCoord(pos) + packRoomName(pos.roomName);
}

/**
 * Unpacks a RoomPosition stored as a pair of utf-16 characters.
 *
 * Benchmarking: average of 600ns to execute on shard2 public server.
 */
function unpackPos(chars) {
	const { x, y } = unpackCoord(chars[0]);
	return new RoomPosition(x, y, unpackRoomName(chars[1]));
}

/**
 * Packs a list of RoomPositions as a utf-16 string. This is better than having a list of packed RoomPositions, as it
 * avoids extra commas and "" when memroy gets stringified.
 *
 * Benchmarking: average of 150ns per position to execute on shard2 public server, reduce stringified size by 95%
 */
function packPosList(posList) {
	let str = '';
	for (let i = 0; i < posList.length; ++i) {
		str += packPos(posList[i]);
	}
	return str;
}

/**
 * Unpacks a list of RoomPositions stored as a utf-16 string.
 *
 * Benchmarking: average of 1.5us per position to execute on shard2 public server.
 */
function unpackPosList(chars) {
	const posList = [];
	for (let i = 0; i < chars.length; i += 2) {
		posList.push(unpackPos(chars.substr(i, 2)));
	}
	return posList;
}

// Export everything
exports.packId = packId;
exports.unpackId = unpackId;
exports.packIdList = packIdList;
exports.unpackIdList = unpackIdList;
exports.packCoord = packCoord;
exports.unpackCoord = unpackCoord;
exports.unpackCoordAsPos = unpackCoordAsPos;
exports.packCoordList = packCoordList;
exports.unpackCoordList = unpackCoordList;
exports.unpackCoordListAsPosList = unpackCoordListAsPosList;
exports.packPos = packPos;
exports.unpackPos = unpackPos;
exports.packPosList = packPosList;
exports.unpackPosList = unpackPosList;


// Useful to register these functions on global to use with console
global.packId = packId;
global.unpackId = unpackId;
global.packIdList = packIdList;
global.unpackIdList = unpackIdList;
global.packCoord = packCoord;
global.unpackCoord = unpackCoord;
global.unpackCoordAsPos = unpackCoordAsPos;
global.packCoordList = packCoordList;
global.unpackCoordList = unpackCoordList;
global.unpackCoordListAsPosList = unpackCoordListAsPosList;
global.packPos = packPos;
global.unpackPos = unpackPos;
global.packPosList = packPosList;
global.unpackPosList = unpackPosList;
