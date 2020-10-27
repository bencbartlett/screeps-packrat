# screeps-packrat

Lightning-fast and memory-efficient serialization of Screeps IDs, Coords, and RoomPositions

Code written by Muon as part of Overmind Screeps AI.

Feel free to adapt as desired.

To use: import desired functions from module, or import entire module on main and use functions from global.

To benchmark: PackratTests.run()

## Available methods
```
+--------------------------+------------------------------------------------+-----------------+--------------------+
|         function         |                  description                   | execution time* | memory reduction** |
+--------------------------+------------------------------------------------+-----------------+--------------------+
| packId                   | packs a game object id into 6 chars            | 500ns           | -75%               |
| unpackId                 | unpacks 6 chars into original format           | 1.3us           |                    |
| packIdList               | packs a list of ids into a single string       | 500ns/id        | -81%               |
| unpackIdList             | unpacks a string into a list of ids            | 1.2us/id        |                    |
| packPos                  | packs a room position into 2 chars             | 150ns           | -90%               |
| unpackPos                | unpacks 2 chars into a room position           | 600ns           |                    |
| packPosList              | packs a list of room positions into a string   | 150ns/pos       | -95%               |
| unpackPosList            | unpacks a string into a list of room positions | 1.5us/pos       |                    |
| packCoord                | packs a coord (e.g. {x:25,y:25}) as a string   | 150ns           | -80%               |
| unpackCoord              | unpacks a string into a coord                  | 60-150ns        |                    |
| packCoordList            | packs a list of coords as a string             | 120ns/coord     | -94%               |
| unpackCoordList          | unpacks a string into a list of coords         | 100ns/coord     |                    |
| unpackCoordAsPos         | unpacks string + room name into a pos          | 500ns           |                    |
| unpackCoordListAsPosList | unpacks string + room name into a list of pos  | 500ns/coord     |                    |
+--------------------------+------------------------------------------------+-----------------+--------------------+
```

*Execution time measured on shard2 public servers and may vary on different machines or shards.
**Memory reduction for list functions is the asymptotic limit of lists containing many entries. Lower reductions can be expected for smaller lists.
