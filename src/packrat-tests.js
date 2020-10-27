"use strict";

import {
    Coord,
    packCoord,
    packCoordList,
    packId,
    packIdList, packPos, packPosList,
    unpackCoord, unpackCoordAsPos,
    unpackCoordList, unpackCoordListAsPosList,
    unpackId,
    unpackIdList, unpackPos, unpackPosList
} from './packrat';

Object.defineProperty(exports, "__esModule", { value: true });
const packrat = require("./packrat");


/**
 * Packrat tests and benchmarking
 * To benchmark: PackratTests.run()
 */
export class PackratTests {

    static testIdPacker() {

        const ogStart = Game.cpu.getUsed();

        let start, elapsed;

        console.log(`Collecting ids...`);

        start = Game.cpu.getUsed();
        const allIds = [];
        for (const name in Game.creeps) {
            const id = Game.creeps[name].id;
            if (!id) {
                console.log(`Game.creeps.${name} has no id: ${id}! wtf`);
            } else {
                allIds.push();
            }
        }
        for (const id in Game.structures) {
            if (!id) {
                console.log(`Game.structures has an undefined id: ${id}! wtf`);
            } else {
                allIds.push(id);
            }
        }
        console.log(`Time elapsed: ${Game.cpu.getUsed() - start}`);


        console.log(`Testing id encoding...`);
        start = Game.cpu.getUsed();
        const idsPacked = [];
        for (let i = 0, len = allIds.length; i < len; ++i) {
            idsPacked.push(packId(allIds[i]));
        }
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / idsPacked.length}`);
        console.log(`Unpacked len: ${JSON.stringify(allIds).length} | Packed len: ${JSON.stringify(idsPacked).length}`);

        console.log(`Testing listId encoding...`);
        start = Game.cpu.getUsed();
        const idsListPacked = packIdList(allIds);
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / (idsListPacked.length / 6)}`);
        console.log(`List-packed len: ${JSON.stringify(idsListPacked).length}`);

        console.log(`Testing id decoding...`);
        start = Game.cpu.getUsed();
        const idsUnpacked = [];
        for (let i = 0, len = idsPacked.length; i < len; ++i) {
            idsUnpacked.push(unpackId(idsPacked[i]));
        }
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / idsUnpacked.length}`);

        console.log(`Testing id list-decoding...`);
        start = Game.cpu.getUsed();
        const idsListUnpacked = unpackIdList(idsListPacked);
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / idsListUnpacked.length}`);

        console.log(`Verifying equality...`);
        let idsEqual = true;
        for (let i = 0; i < allIds.length; i++) {
            if (idsUnpacked[i] != allIds[i]) {
                console.log(`Unpacked id not equal! orig: ${allIds[i]}; unpacked: ${idsUnpacked[i]}`);
                idsEqual = false;
                break;
            }
            if (idsListUnpacked[i] != allIds[i]) {
                console.log(`Unpacked id not equal! orig: ${allIds[i]}; listUnpacked: ${idsListUnpacked[i]}`);
                idsEqual = false;
                break;
            }
        }
        console.log(`Retrieved ids are equal: ${idsEqual}`);

        console.log(`Total time elapsed: ${Game.cpu.getUsed() - ogStart}`);

    }


    static testCoordPacker() {

        const ogStart = Game.cpu.getUsed();

        let start, elapsed;

        console.log(`Collecting positions...`);

        start = Game.cpu.getUsed();
        const allCoord = [];
        for (const name in Game.creeps) {
            const pos = Game.creeps[name].pos;
            allCoord.push({x: pos.x, y: pos.y});
        }
        for (const id in Game.structures) {
            const pos = Game.structures[id].pos;
            allCoord.push({x: pos.x, y: pos.y});
        }
        console.log(`Time elapsed: ${Game.cpu.getUsed() - start}`);


        console.log(`Testing coord encoding...`);

        start = Game.cpu.getUsed();
        const coordPacked = [];
        for (let i = 0, len = allCoord.length; i < len; ++i) {
            coordPacked.push(packCoord(allCoord[i]));
        }
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / coordPacked.length}`);
        console.log(`Unpacked len: ${JSON.stringify(allCoord).length}`);
        console.log(`Packed len: ${JSON.stringify(coordPacked).length}`);

        console.log(`Testing listCoord encoding...`);
        start = Game.cpu.getUsed();
        const coordListPacked = packCoordList(allCoord);
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / coordListPacked.length}`);
        console.log(`List-packed len: ${JSON.stringify(coordListPacked).length}`);


        console.log(`Testing coord decoding...`);
        start = Game.cpu.getUsed();
        const coordUnpacked = [];
        for (let i = 0, len = coordPacked.length; i < len; ++i) {
            coordUnpacked.push(unpackCoord(coordPacked[i]));
        }
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / coordUnpacked.length}`);


        console.log(`Testing listCoord decoding...`);
        start = Game.cpu.getUsed();
        const coordListUnpacked = unpackCoordList(coordListPacked);
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / coordListUnpacked.length}`);

        console.log(`Testing coord to pos decoding...`);
        start = Game.cpu.getUsed();
        const coordAsPosUnpacked = [];
        for (let i = 0, len = coordPacked.length; i < len; ++i) {
            coordAsPosUnpacked.push(unpackCoordAsPos(coordPacked[i], 'W10N10'));
        }
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / coordAsPosUnpacked.length}`);


        console.log(`Testing listCoord to posList decoding...`);
        start = Game.cpu.getUsed();
        const coordListAsPosListUnpacked = unpackCoordListAsPosList(coordListPacked, 'W10N10');
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / coordListAsPosListUnpacked.length}`);


        let posEqual = true;
        for (let i = 0; i < allCoord.length; i++) {
            if (!(allCoord[i].x == coordAsPosUnpacked[i].x && allCoord[i].y == coordAsPosUnpacked[i].y)) {
                console.log(`Unpacked pos not equal! orig: ${JSON.stringify(allCoord[i])}; `+
                            `unpacked: ${JSON.stringify(coordAsPosUnpacked[i])}`);
                posEqual = false;
                break;
            }
            if (!(allCoord[i].x == coordListAsPosListUnpacked[i].x && allCoord[i].y == coordListAsPosListUnpacked[i].y)) {
                console.log(`Unpacked pos not equal! orig: ${JSON.stringify(allCoord[i])}; `+
                            `unpacked: ${JSON.stringify(coordListAsPosListUnpacked[i])}`);
                posEqual = false;
                break;
            }
        }
        console.log(`Retrieved coords are equal: ${posEqual}`);

        console.log(`Total time elapsed: ${Game.cpu.getUsed() - ogStart}`);

    }


    static testPosPacker() {

        const ogStart = Game.cpu.getUsed();

        let start, elapsed;

        console.log(`Collecting positions...`);

        start = Game.cpu.getUsed();
        const allPos = [];
        for (const name in Game.creeps) {
            allPos.push(Game.creeps[name].pos);
        }
        for (const id in Game.structures) {
            allPos.push(Game.structures[id].pos);
        }
        console.log(`Time elapsed: ${Game.cpu.getUsed() - start}`);


        console.log(`Testing pos encoding...`);

        start = Game.cpu.getUsed();
        const posPacked = [];
        for (let i = 0, len = allPos.length; i < len; ++i) {
            posPacked.push(packPos(allPos[i]));
        }
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / posPacked.length}`);
        console.log(`Unpacked len: ${JSON.stringify(allPos).length}`);
        console.log(`Packed len: ${JSON.stringify(posPacked).length}`);

        console.log(`Testing listPos encoding...`);
        start = Game.cpu.getUsed();
        const posListPacked = packPosList(allPos);
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / (posListPacked.length / 2)}`);
        console.log(`List-packed len: ${JSON.stringify(posListPacked).length}`);


        console.log(`Testing pos decoding...`);
        start = Game.cpu.getUsed();
        const posUnpacked = [];
        for (let i = 0, len = posPacked.length; i < len; ++i) {
            posUnpacked.push(unpackPos(posPacked[i]));
        }
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / posUnpacked.length}`);


        console.log(`Testing listPos decoding...`);
        start = Game.cpu.getUsed();
        const posListUnpacked = unpackPosList(posListPacked);
        elapsed = Game.cpu.getUsed() - start;
        console.log(`Time elapsed: ${elapsed}; avg: ${elapsed / posListUnpacked.length}`);


        let posEqual = true;
        for (let i = 0; i < allPos.length; i++) {
            if (!allPos[i].isEqualTo(posUnpacked[i])) {
                console.log(`Unpacked pos not equal! orig: ${allPos[i]}; unpacked: ${posUnpacked[i]}`);
                posEqual = false;
                break;
            }
            if (!allPos[i].isEqualTo(posListUnpacked[i])) {
                console.log(`Unpacked pos not equal! orig: ${allPos[i]}; unpacked: ${posListUnpacked[i]}`);
                posEqual = false;
                break;
            }
        }
        console.log(`Retrieved pos are equal: ${posEqual}`);

        console.log(`Total time elapsed: ${Game.cpu.getUsed() - ogStart}`);

    }

    static run() {
        PackratTests.testIdPacker();
        PackratTests.testCoordPacker();
        PackratTests.testPosPacker();
    }

}

exports.PackratTests = PackratTests;
global.PackratTests = PackratTests;
