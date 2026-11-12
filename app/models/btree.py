class Record:
    def __init__(self, key=None, offset=None):
        self.key = key
        self.offset = offset

    def __repr__(self):
        return f"Record(key={self.key}, offset={self.offset})"


class BTreeNode:
    def __init__(self, order: int):
        self.num_keys = 0                               
        self.records = [None for _ in range(order)] 
        self.children = [None for _ in range(order + 1)]

    def is_leaf(self) -> bool:
        return self.children[0] is None


class BTree:
    def __init__(self, order: int):
        self.order = order
        self.root = None
        self.splits_count = 0
        self.total_keys = 0
        self.last_search_comparisons = 0
        self.last_search_nodes_visited = 0
        self.last_search_key = None

    def get_height(self) -> int:
        if self.root is None:
            return 0
        height = 1
        curr = self.root
        while not curr.is_leaf():
            curr = curr.children[0]
            height += 1
        return height

    def search(self, key: int, node: BTreeNode = None) -> Record | None:
        is_external_call = node is None
        if is_external_call:
            self.last_search_key = key
            self.last_search_comparisons = 0
            self.last_search_nodes_visited = 0
            if self.root is None:
                return None
            node = self.root

        self.last_search_nodes_visited += 1

        i = 0
        while i < node.num_keys:
            self.last_search_comparisons += 1
            if key <= node.records[i].key:
                break
            i += 1

        if i < node.num_keys and key == node.records[i].key:
            return node.records[i]

        if node.is_leaf():
            return None

        return self.search(key, node.children[i])

    def in_order(self) -> list[Record]:
        """Retorna todos os registros em ordem crescente de chave."""
        records: list[Record] = []
        if self.root is not None:
            self._in_order_node(self.root, records)
        return records

    def _in_order_node(self, node: BTreeNode, records: list[Record]):
        for i in range(node.num_keys):
            if not node.is_leaf():
                self._in_order_node(node.children[i], records)
            records.append(node.records[i])
        if not node.is_leaf():
            self._in_order_node(node.children[node.num_keys], records)

    def insert(self, key: int, offset: int):
        if self.search(key) is not None:
            raise KeyError(f"Chave {key} já cadastrada na Árvore B.")

        self.last_search_key = None
        self.last_search_comparisons = 0
        self.last_search_nodes_visited = 0

        new_record = Record(key, offset)

        if self.root is None:
            self.root = BTreeNode(self.order)
            self.root.records[0] = new_record
            self.root.num_keys = 1
            self.total_keys += 1
            return

        if self.root.num_keys == self.order:
            new_root = BTreeNode(self.order)
            new_root.children[0] = self.root
            self._split_child(new_root, 0, self.root)
            self.root = new_root
            self._insert_non_full(self.root, new_record)
        else:
            self._insert_non_full(self.root, new_record)

        self.total_keys += 1

    def _split_child(self, parent, index, child):
        self.splits_count += 1
        mid = self.order // 2
        promoted_record = child.records[mid]
        new_sibling = BTreeNode(self.order)

        j = 0
        for i in range(mid + 1, child.num_keys):
            new_sibling.records[j] = child.records[i]
            child.records[i] = None
            j += 1
        new_sibling.num_keys = j

        if not child.is_leaf():
            k = 0
            for i in range(mid + 1, child.num_keys + 1):
                new_sibling.children[k] = child.children[i]
                child.children[i] = None
                k += 1

        child.records[mid] = None
        child.num_keys = mid

        for i in range(parent.num_keys, index, -1):
            parent.children[i + 1] = parent.children[i]
        parent.children[index + 1] = new_sibling

        for i in range(parent.num_keys - 1, index - 1, -1):
            parent.records[i + 1] = parent.records[i]
        parent.records[index] = promoted_record
        parent.num_keys += 1

    def _insert_non_full(self, node, record):
        i = node.num_keys - 1

        if node.is_leaf():
            while i >= 0 and record.key < node.records[i].key:
                node.records[i + 1] = node.records[i]
                i -= 1

            node.records[i + 1] = record
            node.num_keys += 1

        else:
            while i >= 0 and record.key < node.records[i].key:
                i -= 1
            i += 1

            if node.children[i].num_keys == self.order:
                self._split_child(node, i, node.children[i])

                if record.key > node.records[i].key:
                    i += 1

            self._insert_non_full(node.children[i], record)

    def get_instrumentation(self) -> dict:
        return {
            "order": self.order,
            "total_keys": self.total_keys,
            "height": self.get_height(),
            "splits_count": self.splits_count,
            "last_search_key": self.last_search_key,
            "last_search_comparisons": self.last_search_comparisons,
            "last_search_nodes_visited": self.last_search_nodes_visited,
        }