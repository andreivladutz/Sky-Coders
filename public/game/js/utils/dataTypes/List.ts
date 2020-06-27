export class Node<T> {
  prev: Node<T>;
  next: Node<T>;
  value: T;

  constructor(prev: Node<T> = null, next: Node<T> = null, value: T = null) {
    this.prev = prev;
    this.next = next;
    this.value = value;
  }
}

// doubly linked list
export default class List<T> {
  head: Node<T>;

  constructor() {
    this.head = new Node();

    this.head.prev = this.head;
    this.head.next = this.head;
  }

  getFirst(): Node<T> {
    return this.head.next;
  }

  getLast(): Node<T> {
    return this.head.prev;
  }

  // call the cb function with each node in the list
  each(callback: (node: Node<T>) => void) {
    let first = this.getFirst();

    while (first !== this.head) {
      callback(first);

      first = first.next;
    }
  }

  // push to the end of the list
  push(value: T): void {
    let oldPrev = this.head.prev;

    this.head.prev = new Node(oldPrev, this.head, value);
    oldPrev.next = this.head.prev;
  }

  // get the value at the end of the list
  pop(): T {
    if (this.head.prev === this.head) {
      return null;
    }

    let node = this.head.prev;

    this.head.prev = node.prev;
    node.prev.next = this.head;

    return node.value;
  }

  // remove this node from the list in O(1)
  remove(node: Node<T>): void {
    let prev = node.prev,
      next = node.next;

    prev.next = next;
    next.prev = prev;
  }
}
