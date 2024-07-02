import struct
import json
from datetime import datetime

HEADERS = {
    "OTBM_MAP_HEADER": 0x00,
    "OTBM_MAP_DATA": 0x02,
    "OTBM_TILE_AREA": 0x04,
    "OTBM_TILE": 0x05,
    "OTBM_ITEM": 0x06,
    "OTBM_TOWNS": 0x0C,
    "OTBM_TOWN": 0x0D,
    "OTBM_HOUSETILE": 0x0E,
    "OTBM_WAYPOINTS": 0x0F,
    "OTBM_WAYPOINT": 0x10,
    "OTBM_ATTR_DESCRIPTION": 0x01,
    "OTBM_ATTR_EXT_FILE": 0x02,
    "OTBM_ATTR_TILE_FLAGS": 0x03,
    "OTBM_ATTR_ACTION_ID": 0x04,
    "OTBM_ATTR_UNIQUE_ID": 0x05,
    "OTBM_ATTR_TEXT": 0x06,
    "OTBM_ATTR_DESC": 0x07,
    "OTBM_ATTR_TELE_DEST": 0x08,
    "OTBM_ATTR_ITEM": 0x09,
    "OTBM_ATTR_DEPOT_ID": 0x0A,
    "OTBM_ATTR_EXT_SPAWN_FILE": 0x0B,
    "OTBM_ATTR_EXT_HOUSE_FILE": 0x0D,
    "OTBM_ATTR_HOUSEDOORID": 0x0E,
    "OTBM_ATTR_COUNT": 0x0F,
    "OTBM_ATTR_RUNE_CHARGES": 0x16,
    "TILESTATE_NONE": 0x0000,
    "TILESTATE_PROTECTIONZONE": 0x0001,
    "TILESTATE_DEPRECATED": 0x0002,
    "TILESTATE_NOPVP": 0x0004,
    "TILESTATE_NOLOGOUT": 0x0008,
    "TILESTATE_PVPZONE": 0x0010,
    "TILESTATE_REFRESH": 0x0020
}

NODE_ESC = 0xFD
NODE_INIT = 0xFE
NODE_TERM = 0xFF
__VERSION__ = "1.0.1"

def write_otbm(outfile, data):
    with open(outfile, "wb") as f:
        f.write(serialize_otbm(data))

def node_to_dict(node):
    return {key: getattr(node, key) for key in dir(node) if not key.startswith('_') and not callable(getattr(node, key))}

def serialize_otbm(data):
    def write_node(node):
        return b"".join([
            struct.pack("B", NODE_INIT),
            write_element(node),
            b"".join(map(write_node, get_child_node(node))),
            struct.pack("B", NODE_TERM),
        ])

    def get_child_node(node):
        return get_child_node_real(node) or []

    def get_child_node_real(node):
        return {
            HEADERS["OTBM_TILE_AREA"]: getattr(node, "tiles", []),
            HEADERS["OTBM_TILE"]: getattr(node, "items", []),
            HEADERS["OTBM_HOUSETILE"]: getattr(node, "items", []),
            HEADERS["OTBM_TOWNS"]: getattr(node, "towns", []),
            HEADERS["OTBM_ITEM"]: getattr(node, "content", []),
            HEADERS["OTBM_MAP_DATA"]: getattr(node, "features", []),
        }.get(node.type, getattr(node, "nodes", []))

    def validate_node(node):
        if hasattr(node, "x") and (node.x < 0 or node.x > 255):
            raise ValueError(f"Invalid node range: {json.dumps(node_to_dict(node))}")
        if hasattr(node, "y") and (node.y < 0 or node.y > 255):
            raise ValueError(f"Invalid node range: {json.dumps(node_to_dict(node))}")
        if hasattr(node, "z") and (node.z < 0 or node.z > 255):
            raise ValueError(f"Invalid node range: {json.dumps(node_to_dict(node))}")

    def write_element(node):
        validate_node(node)
        buffer = b""
        type = node.type

        if type == HEADERS["OTBM_MAP_HEADER"]:
            buffer = struct.pack(
                "<BIIIIHH",
                HEADERS["OTBM_MAP_HEADER"],
                node.version,
                node.mapWidth,
                node.mapHeight,
                node.itemsMajorVersion,
                node.itemsMinorVersion,
                0
            )
        elif type == HEADERS["OTBM_MAP_DATA"]:
            buffer = struct.pack("<B", HEADERS["OTBM_MAP_DATA"])
            buffer += write_attributes(node)
        elif type == HEADERS["OTBM_TILE_AREA"]:
            buffer = struct.pack(
                "<BHHB",
                HEADERS["OTBM_TILE_AREA"],
                node.x,
                node.y,
                node.z
            )
        elif type == HEADERS["OTBM_TILE"]:
            buffer = struct.pack(
                "<BBB",
                HEADERS["OTBM_TILE"],
                node.x,
                node.y
            )
            buffer += write_attributes(node)
        elif type == HEADERS["OTBM_HOUSETILE"]:
            buffer = struct.pack(
                "<BBBI",
                HEADERS["OTBM_HOUSETILE"],
                node.x,
                node.y,
                node.houseId
            )
            buffer += write_attributes(node)
        elif type == HEADERS["OTBM_ITEM"]:
            buffer = struct.pack("<BH", HEADERS["OTBM_ITEM"], node.id)
            buffer += write_attributes(node)
        elif type == HEADERS["OTBM_WAYPOINT"]:
            name_len = len(node.name)
            buffer = struct.pack(
                f"<BH{name_len}sHHB",
                HEADERS["OTBM_WAYPOINT"],
                name_len,
                node.name.encode("ascii"),
                node.x,
                node.y,
                node.z
            )
        elif type == HEADERS["OTBM_WAYPOINTS"]:
            buffer = struct.pack("<B", HEADERS["OTBM_WAYPOINTS"])
        elif type == HEADERS["OTBM_TOWNS"]:
            buffer = struct.pack("<B", HEADERS["OTBM_TOWNS"])
        elif type == HEADERS["OTBM_TOWN"]:
            name_len = len(node.name)
            buffer = struct.pack(
                f"<BIBH{name_len}sHHB",
                HEADERS["OTBM_TOWN"],
                node.townid,
                name_len,
                node.name.encode("ascii"),
                node.x,
                node.y,
                node.z
            )
        else:
            raise ValueError(f"Could not write node. Unknown node type: {node.type}")

        return escape_characters(buffer)

    def escape_characters(buffer):
        result = bytearray()
        for byte in buffer:
            if byte in [NODE_ESC, NODE_INIT, NODE_TERM]:
                result.append(NODE_ESC)
            result.append(byte)
        return bytes(result)

    def write_attributes(node):
        attribute_buffer = bytearray()

        def write_ascii_string_16le(string):
            length = len(string)
            return struct.pack(f"<H{length}s", length, string.encode("ascii"))

        if hasattr(node, "destination"):
            attribute_buffer.extend(struct.pack("<BHHB", HEADERS["OTBM_ATTR_TELE_DEST"], node.destination["x"], node.destination["y"], node.destination["z"]))
        if hasattr(node, "description"):
            attribute_buffer.extend(struct.pack("<B", HEADERS["OTBM_ATTR_DESCRIPTION"]) + write_ascii_string_16le(node.description))
        if hasattr(node, "uid"):
            attribute_buffer.extend(struct.pack("<BH", HEADERS["OTBM_ATTR_UNIQUE_ID"], node.uid))
        if hasattr(node, "aid"):
            attribute_buffer.extend(struct.pack("<BH", HEADERS["OTBM_ATTR_ACTION_ID"], node.aid))
        if hasattr(node, "runeCharges"):
            attribute_buffer.extend(struct.pack("<BH", HEADERS["OTBM_ATTR_RUNE_CHARGES"], node.runeCharges))
        if hasattr(node, "spawnfile"):
            attribute_buffer.extend(struct.pack("<B", HEADERS["OTBM_ATTR_EXT_SPAWN_FILE"]) + write_ascii_string_16le(node.spawnfile))
        if hasattr(node, "text"):
            attribute_buffer.extend(struct.pack("<B", HEADERS["OTBM_ATTR_TEXT"]) + write_ascii_string_16le(node.text))
        if hasattr(node, "housefile"):
            attribute_buffer.extend(struct.pack("<B", HEADERS["OTBM_ATTR_EXT_HOUSE_FILE"]) + write_ascii_string_16le(node.housefile))
        if hasattr(node, "tileid"):
            attribute_buffer.extend(struct.pack("<BH", HEADERS["OTBM_ATTR_ITEM"], node.tileid))
        if hasattr(node, "count"):
            attribute_buffer.extend(struct.pack("<BB", HEADERS["OTBM_ATTR_COUNT"], node.count))
        if hasattr(node, "depotId"):
            attribute_buffer.extend(struct.pack("<BH", HEADERS["OTBM_ATTR_DEPOT_ID"], node.depotId))
        if hasattr(node, "houseDoorId"):
            attribute_buffer.extend(struct.pack("<BB", HEADERS["OTBM_ATTR_HOUSEDOORID"], node.houseDoorId))
        if hasattr(node, "zones"):
            attribute_buffer.extend(struct.pack("<BI", HEADERS["OTBM_ATTR_TILE_FLAGS"], write_flags(node.zones)))

        return bytes(attribute_buffer)

    def write_flags(zones):
        flags = HEADERS["TILESTATE_NONE"]
        flags |= zones.get("protection", 0) * HEADERS["TILESTATE_PROTECTIONZONE"]
        flags |= zones.get("noPVP", 0) * HEADERS["TILESTATE_NOPVP"]
        flags |= zones.get("noLogout", 0) * HEADERS["TILESTATE_NOLOGOUT"]
        flags |= zones.get("PVPZone", 0) * HEADERS["TILESTATE_PVPZONE"]
        flags |= zones.get("refresh", 0) * HEADERS["TILESTATE_REFRESH"]
        return flags

    version = struct.pack("<I", 0x00000000)
    result = version + write_node(data["data"])
    return result

class Node:
    def __init__(self, data, children):
        data = self.remove_escape_characters(data)
        node_type = data[0]

        if node_type == HEADERS["OTBM_MAP_HEADER"]:
            self.type = HEADERS["OTBM_MAP_HEADER"]
            self.version, self.mapWidth, self.mapHeight, self.itemsMajorVersion, self.itemsMinorVersion = struct.unpack("<IHHII", data[1:])
        elif node_type == HEADERS["OTBM_MAP_DATA"]:
            self.type = HEADERS["OTBM_MAP_DATA"]
            self.__dict__.update(read_attributes(data[1:]))
        elif node_type == HEADERS["OTBM_TILE_AREA"]:
            self.type = HEADERS["OTBM_TILE_AREA"]
            self.x, self.y, self.z = struct.unpack("<HHB", data[1:6])
        elif node_type == HEADERS["OTBM_TILE"]:
            self.type = HEADERS["OTBM_TILE"]
            self.x, self.y = struct.unpack("<BB", data[1:3])
            self.__dict__.update(read_attributes(data[3:]))
        elif node_type == HEADERS["OTBM_ITEM"]:
            self.type = HEADERS["OTBM_ITEM"]
            self.id, = struct.unpack("<H", data[1:3])
            self.__dict__.update(read_attributes(data[3:]))
        elif node_type == HEADERS["OTBM_HOUSETILE"]:
            self.type = HEADERS["OTBM_HOUSETILE"]
            self.x, self.y, self.houseId = struct.unpack("<BBI", data[1:7])
            self.__dict__.update(read_attributes(data[7:]))
        elif node_type == HEADERS["OTBM_WAYPOINTS"]:
            self.type = HEADERS["OTBM_WAYPOINTS"]
        elif node_type == HEADERS["OTBM_WAYPOINT"]:
            self.type = HEADERS["OTBM_WAYPOINT"]
            name_len = struct.unpack("<H", data[1:3])[0]
            self.name = data[3:3 + name_len].decode("ascii")
            self.x, self.y, self.z = struct.unpack("<HHB", data[3 + name_len:])
        elif node_type == HEADERS["OTBM_TOWNS"]:
            self.type = HEADERS["OTBM_TOWNS"]
        elif node_type == HEADERS["OTBM_TOWN"]:
            self.type = HEADERS["OTBM_TOWN"]
            self.townid = struct.unpack("<I", data[1:5])[0]
            name_len = struct.unpack("<H", data[5:7])[0]
            self.name = data[7:7 + name_len].decode("ascii")
            self.x, self.y, self.z = struct.unpack("<HHB", data[7 + name_len:])
        else:
            raise ValueError(f"Unknown node type: {node_type}")

        self.set_children(children)

    def remove_escape_characters(self, node_data):
        i_esc = 0
        while True:
            index = node_data.find(NODE_ESC, i_esc)
            if index == -1:
                break
            node_data = node_data[:index] + node_data[index + 1:]
            i_esc = index
        return node_data

    def set_children(self, children):
        if not children:
            return

        if self.type == HEADERS["OTBM_TILE_AREA"]:
            self.tiles = children
        elif self.type in [HEADERS["OTBM_TILE"], HEADERS["OTBM_HOUSETILE"]]:
            self.items = children
        elif self.type == HEADERS["OTBM_TOWNS"]:
            self.towns = children
        elif self.type == HEADERS["OTBM_ITEM"]:
            self.content = children
        elif self.type == HEADERS["OTBM_MAP_DATA"]:
            self.features = children
        else:
            self.nodes = children

def read_otbm(infile):
    class Node:
        def __init__(self, data, children):
            data = self.remove_escape_characters(data)
            node_type = data[0]

            if node_type == HEADERS["OTBM_MAP_HEADER"]:
                self.type = HEADERS["OTBM_MAP_HEADER"]
                self.version, self.mapWidth, self.mapHeight, self.itemsMajorVersion, self.itemsMinorVersion = struct.unpack("<IHHII", data[1:])
            elif node_type == HEADERS["OTBM_MAP_DATA"]:
                self.type = HEADERS["OTBM_MAP_DATA"]
                self.__dict__.update(read_attributes(data[1:]))
            elif node_type == HEADERS["OTBM_TILE_AREA"]:
                self.type = HEADERS["OTBM_TILE_AREA"]
                self.x, self.y, self.z = struct.unpack("<HHB", data[1:6])
            elif node_type == HEADERS["OTBM_TILE"]:
                self.type = HEADERS["OTBM_TILE"]
                self.x, self.y = struct.unpack("<BB", data[1:3])
                self.__dict__.update(read_attributes(data[3:]))
            elif node_type == HEADERS["OTBM_ITEM"]:
                self.type = HEADERS["OTBM_ITEM"]
                self.id, = struct.unpack("<H", data[1:3])
                self.__dict__.update(read_attributes(data[3:]))
            elif node_type == HEADERS["OTBM_HOUSETILE"]:
                self.type = HEADERS["OTBM_HOUSETILE"]
                self.x, self.y, self.houseId = struct.unpack("<BBI", data[1:7])
                self.__dict__.update(read_attributes(data[7:]))
            elif node_type == HEADERS["OTBM_WAYPOINTS"]:
                self.type = HEADERS["OTBM_WAYPOINTS"]
            elif node_type == HEADERS["OTBM_WAYPOINT"]:
                self.type = HEADERS["OTBM_WAYPOINT"]
                name_len = struct.unpack("<H", data[1:3])[0]
                self.name = data[3:3 + name_len].decode("ascii")
                self.x, self.y, self.z = struct.unpack("<HHB", data[3 + name_len:])
            elif node_type == HEADERS["OTBM_TOWNS"]:
                self.type = HEADERS["OTBM_TOWNS"]
            elif node_type == HEADERS["OTBM_TOWN"]:
                self.type = HEADERS["OTBM_TOWN"]
                self.townid = struct.unpack("<I", data[1:5])[0]
                name_len = struct.unpack("<H", data[5:7])[0]
                self.name = data[7:7 + name_len].decode("ascii")
                self.x, self.y, self.z = struct.unpack("<HHB", data[7 + name_len:])
            else:
                raise ValueError(f"Unknown node type: {node_type}")

            self.set_children(children)

        def remove_escape_characters(self, node_data):
            i_esc = 0
            while True:
                index = node_data.find(NODE_ESC, i_esc)
                if index == -1:
                    break
                node_data = node_data[:index] + node_data[index + 1:]
                i_esc = index
            return node_data

        def set_children(self, children):
            if not children:
                return

            if self.type == HEADERS["OTBM_TILE_AREA"]:
                self.tiles = children
            elif self.type in [HEADERS["OTBM_TILE"], HEADERS["OTBM_HOUSETILE"]]:
                self.items = children
            elif self.type == HEADERS["OTBM_TOWNS"]:
                self.towns = children
            elif self.type == HEADERS["OTBM_ITEM"]:
                self.content = children
            elif self.type == HEADERS["OTBM_MAP_DATA"]:
                self.features = children
            else:
                self.nodes = children

    def read_ascii_string_16le(data):
        length = struct.unpack("<H", data[:2])[0]
        return data[2:2 + length].decode("ascii")

    def read_attributes(data):
        properties = {}
        i = 0

        while i + 1 < len(data):
            attr_type = data[i]
            i += 1

            if attr_type == HEADERS["OTBM_ATTR_TEXT"]:
                properties["text"] = read_ascii_string_16le(data[i:])
                i += len(properties["text"]) + 2
            elif attr_type == HEADERS["OTBM_ATTR_EXT_SPAWN_FILE"]:
                properties["spawnfile"] = read_ascii_string_16le(data[i:])
                i += len(properties["spawnfile"]) + 2
            elif attr_type == HEADERS["OTBM_ATTR_EXT_HOUSE_FILE"]:
                properties["housefile"] = read_ascii_string_16le(data[i:])
                i += len(properties["housefile"]) + 2
            elif attr_type == HEADERS["OTBM_ATTR_HOUSEDOORID"]:
                properties["houseDoorId"] = data[i]
                i += 1
            elif attr_type == HEADERS["OTBM_ATTR_DESCRIPTION"]:
                description = read_ascii_string_16le(data[i:])
                if "description" in properties:
                    properties["description"] += f" {description}"
                else:
                    properties["description"] = description
                i += len(description) + 2
            elif attr_type == HEADERS["OTBM_ATTR_DEPOT_ID"]:
                properties["depotId"] = struct.unpack("<H", data[i:i + 2])[0]
                i += 2
            elif attr_type == HEADERS["OTBM_ATTR_TILE_FLAGS"]:
                properties["zones"] = read_flags(struct.unpack("<I", data[i:i + 4])[0])
                i += 4
            elif attr_type == HEADERS["OTBM_ATTR_RUNE_CHARGES"]:
                properties["runeCharges"] = struct.unpack("<H", data[i:i + 2])[0]
                i += 2
            elif attr_type == HEADERS["OTBM_ATTR_COUNT"]:
                properties["count"] = data[i]
                i += 1
            elif attr_type == HEADERS["OTBM_ATTR_ITEM"]:
                properties["tileid"] = struct.unpack("<H", data[i:i + 2])[0]
                i += 2
            elif attr_type == HEADERS["OTBM_ATTR_ACTION_ID"]:
                properties["aid"] = struct.unpack("<H", data[i:i + 2])[0]
                i += 2
            elif attr_type == HEADERS["OTBM_ATTR_UNIQUE_ID"]:
                properties["uid"] = struct.unpack("<H", data[i:i + 2])[0]
                i += 2
            elif attr_type == HEADERS["OTBM_ATTR_TELE_DEST"]:
                properties["destination"] = {
                    "x": struct.unpack("<H", data[i:i + 2])[0],
                    "y": struct.unpack("<H", data[i + 2:i + 4])[0],
                    "z": data[i + 4],
                }
                i += 5

        return properties

    def read_flags(flags):
        return {
            "protection": bool(flags & HEADERS["TILESTATE_PROTECTIONZONE"]),
            "noPVP": bool(flags & HEADERS["TILESTATE_NOPVP"]),
            "noLogout": bool(flags & HEADERS["TILESTATE_NOLOGOUT"]),
            "PVPZone": bool(flags & HEADERS["TILESTATE_PVPZONE"]),
            "refresh": bool(flags & HEADERS["TILESTATE_REFRESH"]),
        }

    def read_node(data):
        data = data[1:]
        i = 0
        children = []
        node_data = None

        while i < len(data):
            c_byte = data[i]

            if node_data is None and (c_byte == NODE_INIT or c_byte == NODE_TERM):
                node_data = data[:i]

            if c_byte == NODE_ESC:
                i += 2
                continue

            if c_byte == NODE_INIT:
                child = read_node(data[i:])
                children.append(child["node"])
                i += 2 + child["i"]
                continue

            if c_byte == NODE_TERM:
                return {"node": Node(node_data, children), "i": i}

            i += 1

    with open(infile, "rb") as f:
        data = f.read()

    map_identifier = struct.unpack("<I", data[:4])[0]
    if map_identifier not in [0x00000000, 0x4D42544F]:
        raise ValueError("Unknown OTBM format: unexpected magic bytes.")

    map_data = {
        "version": __VERSION__,
        "identifier": map_identifier,
        "data": read_node(data[4:])["node"]
    }

    return map_data
