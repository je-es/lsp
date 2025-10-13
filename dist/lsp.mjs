var __async = (__this, __arguments, generator) => {
  return new Promise((resolve2, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve2(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// lib/lsp.ts
import {
  DidChangeConfigurationNotification,
  TextDocumentSyncKind
} from "vscode-languageserver";

// ../project/dist/project.mjs
import * as path from "path";
import * as fs from "fs";
import * as Path from "path";
import * as EventEmitter from "events";
import * as crypto from "crypto";
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async2 = (__this, __arguments, generator) => {
  return new Promise((resolve2, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve2(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var DEF_SPAN = { start: -1, end: -1 };
var Node = class _Node {
  findAll(predicate) {
    const results = [];
    this.traverse((node) => {
      if (predicate(node)) {
        results.push(node);
      }
    });
    return results;
  }
  find(predicate) {
    let result = null;
    this.traverse((node) => {
      if (!result && predicate(node)) {
        result = node;
        return "stop";
      }
    });
    return result;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────────── TRAVERSE ────────────────────────────┐
  // Depth-first traversal with early termination support and enhanced error handling
  traverse(visitor) {
    var _a, _b, _c, _d, _e;
    try {
      const result = visitor(this);
      if (result === "stop") {
        return;
      }
      let children;
      try {
        children = this.getChildrenNodes();
      } catch (error) {
        throw new Error(`Failed to get children from ${this.kind} node: ${error}`);
      }
      if (!Array.isArray(children)) {
        throw new Error(`getChildrenNodes() returned non-array from ${this.kind} node: ${typeof children}`);
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child) {
          console.warn(`Child ${i} is null/undefined in ${this.kind} node`);
          continue;
        }
        if (typeof child !== "object") {
          console.warn(`Child ${i} is not an object in ${this.kind} node: ${typeof child}`);
          continue;
        }
        if (!("traverse" in child) || typeof child.traverse !== "function") {
          console.error(`Child ${i} (${((_a = child.constructor) == null ? void 0 : _a.name) || "unknown"}) of ${this.kind} node is missing traverse method`);
          console.error("Child object keys:", Object.keys(child));
          console.error("Child prototype:", Object.getPrototypeOf(child));
          throw new Error(`Child node ${((_b = child.constructor) == null ? void 0 : _b.name) || "unknown"} missing traverse method`);
        }
        if (!(child instanceof _Node)) {
          console.error(`Child ${i} of ${this.kind} node is not a Node instance:`, (_c = child.constructor) == null ? void 0 : _c.name);
          throw new Error(`Child ${((_d = child.constructor) == null ? void 0 : _d.name) || "unknown"} is not a Node instance`);
        }
        try {
          child.traverse(visitor);
        } catch (error) {
          throw new Error(`Traversal failed at child ${i} (${((_e = child.constructor) == null ? void 0 : _e.name) || "unknown"}) of ${this.kind} node: ${error}`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Traversal failed")) {
        throw error;
      }
      throw new Error(`Traversal failed at ${this.kind} node: ${error}`);
    }
  }
  // Pre-order traversal (visit parent before children)
  traversePreOrder(visitor) {
    this.traverse(visitor);
  }
  // Post-order traversal (visit children before parent)
  traversePostOrder(visitor) {
    const visitPostOrder = (node) => {
      for (const child of node.getChildrenNodes()) {
        const result = visitPostOrder(child);
        if (result === "stop") {
          return "stop";
        }
      }
      return visitor(node);
    };
    visitPostOrder(this);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // Check if this node has any children
  hasChildren() {
    try {
      return this.getChildrenNodes().length > 0;
    } catch (e) {
      return false;
    }
  }
  // Check if this node is a leaf (no children)
  isLeaf() {
    return !this.hasChildren();
  }
  // Get the depth of this node (maximum distance to any leaf)
  getDepth() {
    if (this.isLeaf()) {
      return 0;
    }
    let maxDepth = 0;
    try {
      for (const child of this.getChildrenNodes()) {
        maxDepth = Math.max(maxDepth, child.getDepth());
      }
    } catch (error) {
      console.warn(`Error getting depth for ${this.kind} node:`, error);
      return 0;
    }
    return maxDepth + 1;
  }
  // Count total number of descendant nodes (including self)
  getNodeCount() {
    let count = 1;
    try {
      this.traverse((node) => {
        if (node !== this) {
          count++;
        }
      });
    } catch (error) {
      console.warn(`Error counting nodes for ${this.kind} node:`, error);
    }
    return count;
  }
  // Get all ancestor kind's in the tree
  getNodeKinds() {
    const types = /* @__PURE__ */ new Set();
    try {
      this.traverse((node) => {
        types.add(node.kind);
      });
    } catch (error) {
      console.warn(`Error getting node types for ${this.kind} node:`, error);
      types.add(this.kind);
    }
    return types;
  }
  // Create a deep clone of the entire subtree
  deepClone(newSpan) {
    const cloned = this.clone(newSpan);
    return cloned;
  }
  // Validation method that subclasses can override
  validate() {
    try {
      const children = this.getChildrenNodes();
      for (const child of children) {
        if (!child || !child.validate()) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn(`Validation error for ${this.kind} node:`, error);
      return false;
    }
  }
  // Pretty print the AST structure with better error handling
  printTree(indent = 0) {
    const spaces = "  ".repeat(indent);
    const nodeInfo = `${spaces}${this.kind} (${this.span.start}-${this.span.end})`;
    try {
      if (this.isLeaf()) {
        return nodeInfo;
      }
      const children = this.getChildrenNodes().map((child) => {
        var _a;
        try {
          return child.printTree(indent + 1);
        } catch (error) {
          return `${spaces}  ERROR: ${((_a = child == null ? void 0 : child.constructor) == null ? void 0 : _a.name) || "unknown"} - ${error}`;
        }
      }).join("\n");
      return `${nodeInfo}
${children}`;
    } catch (error) {
      return `${nodeInfo} [ERROR: ${error}]`;
    }
  }
  // Check structural equality with another node (ignoring spans)
  structurallyEquals(other) {
    if (this.kind !== other.kind) {
      return false;
    }
    try {
      const thisChildren = this.getChildrenNodes();
      const otherChildren = other.getChildrenNodes();
      if (thisChildren.length !== otherChildren.length) {
        return false;
      }
      return thisChildren.every(
        (child, index) => child.structurallyEquals(otherChildren[index])
      );
    } catch (e) {
      return false;
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var IdentNode = class _IdentNode extends Node {
  constructor(span, name, builtin) {
    super();
    this.span = span;
    this.name = name;
    this.builtin = builtin;
    this.kind = "Ident";
    this.level = 4;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    return children;
  }
  clone(newSpan) {
    const cloned = new _IdentNode(newSpan != null ? newSpan : this.span, this.name, this.builtin);
    return cloned;
  }
  validate() {
    return this.name.trim().length > 0;
  }
  toString() {
    return `${this.builtin ? "@" : ""}${this.name}`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, name, builtin = false) {
    return new _IdentNode(span, name, builtin);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var LoopStmtNode = class _LoopStmtNode extends Node {
  constructor(span, kind, expr, stmt) {
    super();
    this.span = span;
    this.kind = kind;
    this.expr = expr;
    this.stmt = stmt;
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.expr, this.stmt];
  }
  clone(newSpan) {
    return new _LoopStmtNode(
      newSpan != null ? newSpan : this.span,
      this.kind,
      this.expr,
      this.stmt
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── IS_X ──────────────────────────────┐
  isFor() {
    return this.kind === "For";
  }
  isWhile() {
    return this.kind === "While";
  }
  isDo() {
    return this.kind === "While";
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static createFor(span, expr, stmt) {
    return new _LoopStmtNode(span, "For", expr, stmt);
  }
  static createWhile(span, expr, stmt) {
    return new _LoopStmtNode(span, "While", expr, stmt);
  }
  static createDo(span, expr, stmt) {
    return new _LoopStmtNode(span, "Do", expr, stmt);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ControlFlowStmtNode = class _ControlFlowStmtNode extends Node {
  constructor(span, kind, value) {
    super();
    this.span = span;
    this.kind = kind;
    this.value = value;
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return this.value ? [this.value] : [];
  }
  clone(newSpan) {
    return new _ControlFlowStmtNode(
      newSpan != null ? newSpan : this.span,
      this.kind,
      this.value
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── IS_X ──────────────────────────────┐
  isReturn() {
    return this.kind === "return";
  }
  isDefer() {
    return this.kind === "defer";
  }
  isThrow() {
    return this.kind === "throw";
  }
  isBreak() {
    return this.kind === "break";
  }
  isContinue() {
    return this.kind === "continue";
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static asReturn(span, value) {
    return new _ControlFlowStmtNode(span, "return", value);
  }
  static asDefer(span, value) {
    return new _ControlFlowStmtNode(span, "defer", value);
  }
  static asThrow(span, value) {
    return new _ControlFlowStmtNode(span, "throw", value);
  }
  static asBreak(span) {
    return new _ControlFlowStmtNode(span, "break");
  }
  static asContinue(span) {
    return new _ControlFlowStmtNode(span, "continue");
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var LiteralNode = class _LiteralNode extends Node {
  constructor(kind, span, value) {
    super();
    this.kind = kind;
    this.span = span;
    this.value = value;
    this.level = 4;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    if (this.kind === "Array" && Array.isArray(this.value)) {
      children.push(...this.value);
    }
    return children;
  }
  clone(newSpan) {
    const cloned = new _LiteralNode(this.kind, newSpan != null ? newSpan : this.span, this.value);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HHLP ──────────────────────────────┐
  is(kind) {
    return this.kind === kind;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(kind, span, value) {
    return new _LiteralNode(kind, span, value);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ObjectNode = class _ObjectNode extends Node {
  constructor(span, props, ident) {
    super();
    this.span = span;
    this.props = props;
    this.ident = ident;
    this.kind = "Object";
    this.level = 4;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(...this.props);
    return children;
  }
  clone(newSpan) {
    const cloned = new _ObjectNode(newSpan || this.span, this.props, this.ident);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, props, ident) {
    return new _ObjectNode(span, props, ident);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ParenNode = class _ParenNode extends Node {
  constructor(span, source) {
    super();
    this.span = span;
    this.source = source;
    this.kind = "Paren";
    this.level = 4;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.source);
    return children;
  }
  clone(newSpan) {
    const cloned = new _ParenNode(newSpan || this.span, this.source);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, source) {
    return new _ParenNode(span, source);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var PrimitiveTypeNode = class _PrimitiveTypeNode extends Node {
  constructor(kind, span, text, width) {
    super();
    this.kind = kind;
    this.span = span;
    this.text = text;
    this.width = width;
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [];
  }
  clone(newSpan) {
    const cloned = new _PrimitiveTypeNode(this.kind, newSpan || this.span, this.text, this.width);
    return cloned;
  }
  toString() {
    switch (this.kind) {
      case "void":
        return "void";
      case "type":
        return "type";
      case "bool":
        return "bool";
      case "signed":
        return "i" + this.width;
      case "unsigned":
        return "u" + this.width;
      case "float":
        return "f" + this.width;
      case "und":
        return "undefined";
      case "null":
        return "null";
      case "cint":
        return "cint";
      case "cflt":
        return "cflt";
      case "any":
        return "any";
      case "err":
        return "err";
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  is(kind) {
    return this.kind === kind;
  }
  isVoid() {
    return this.is("void");
  }
  isType() {
    return this.is("type");
  }
  isNull() {
    return this.is("null");
  }
  isUndefined() {
    return this.is("und");
  }
  isBool() {
    return this.is("bool");
  }
  isSigned() {
    return this.is("signed");
  }
  isUnsigned() {
    return this.is("unsigned");
  }
  isFloat() {
    return this.is("float");
  }
  isInteger() {
    return this.is("signed") || this.is("unsigned") || this.is("cint");
  }
  isComptimeInt() {
    return this.is("cint");
  }
  isComptimeFloat() {
    return this.is("cflt");
  }
  isNumeric() {
    return this.is("signed") || this.is("unsigned") || this.is("float") || this.is("cint") || this.is("cflt");
  }
  isAny() {
    return this.is("any");
  }
  isErr() {
    return this.is("err");
  }
  static calcWidth(prefix, text) {
    if (!text.startsWith(prefix)) {
      return 0;
    }
    const numericPart = text.slice(prefix.length);
    const width = parseInt(numericPart, 10);
    if (isNaN(width)) {
      return 0;
    }
    return width;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(kind, span, text, width) {
    return new _PrimitiveTypeNode(kind, span, text, width);
  }
  static asVoid(span) {
    return _PrimitiveTypeNode.create("void", span || DEF_SPAN);
  }
  static asType(span) {
    return _PrimitiveTypeNode.create("type", span || DEF_SPAN);
  }
  static asNull(span) {
    return _PrimitiveTypeNode.create("null", span || DEF_SPAN);
  }
  static asUndefined(span) {
    return _PrimitiveTypeNode.create("und", span || DEF_SPAN);
  }
  static asAny(span) {
    return _PrimitiveTypeNode.create("any", span || DEF_SPAN);
  }
  static asErr(span, text) {
    return _PrimitiveTypeNode.create("err", span || DEF_SPAN, text);
  }
  static asBool(span) {
    return _PrimitiveTypeNode.create("bool", span || DEF_SPAN);
  }
  static asSigned(span, text, width) {
    return _PrimitiveTypeNode.create("signed", span || DEF_SPAN, text, width);
  }
  static asUnsigned(span, text, width) {
    return _PrimitiveTypeNode.create("unsigned", span || DEF_SPAN, text, width);
  }
  static asFloat(span, text, width) {
    return _PrimitiveTypeNode.create("float", span || DEF_SPAN, text, width);
  }
  static asComptimeInt(span, text) {
    return _PrimitiveTypeNode.create("cint", span || DEF_SPAN, text, 64);
  }
  static asComptimeFloat(span, text) {
    return _PrimitiveTypeNode.create("cflt", span || DEF_SPAN, text, 64);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var OptionalTypeNode = class _OptionalTypeNode extends Node {
  constructor(span, target) {
    super();
    this.span = span;
    this.target = target;
    this.kind = "Optional";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.target];
  }
  clone(newSpan) {
    const cloned = new _OptionalTypeNode(newSpan || this.span, this.target);
    return cloned;
  }
  toString() {
    return `?${this.target.toString()}`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, target) {
    return new _OptionalTypeNode(span, target);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var PointerTypeNode = class _PointerTypeNode extends Node {
  constructor(span, target, mutable) {
    super();
    this.span = span;
    this.target = target;
    this.mutable = mutable;
    this.kind = "Pointer";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.target];
  }
  clone(newSpan) {
    const cloned = new _PointerTypeNode(newSpan || this.span, this.target, this.mutable);
    return cloned;
  }
  toString() {
    return `*${this.mutable ? "mut " : ""}${this.target.toString()}`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, target, mutable = false) {
    return new _PointerTypeNode(span, target, mutable);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ArrayTypeNode = class _ArrayTypeNode extends Node {
  constructor(span, target, size, mutable) {
    super();
    this.span = span;
    this.target = target;
    this.size = size;
    this.mutable = mutable;
    this.kind = "Array";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.target);
    if (this.size) {
      children.push(this.size);
    }
    return children;
  }
  clone(newSpan) {
    const cloned = new _ArrayTypeNode(newSpan || this.span, this.target, this.size, this.mutable);
    return cloned;
  }
  toString() {
    return `[]${this.target.toString()}`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  isU8Array() {
    var _a;
    return (_a = this.target.getPrimitive() && this.target.getPrimitive().kind === "unsigned" && this.target.getPrimitive().width === 8) != null ? _a : false;
  }
  isU16Array() {
    var _a;
    return (_a = this.target.getPrimitive() && this.target.getPrimitive().kind === "unsigned" && this.target.getPrimitive().width === 16) != null ? _a : false;
  }
  isU32Array() {
    var _a;
    return (_a = this.target.getPrimitive() && this.target.getPrimitive().kind === "unsigned" && this.target.getPrimitive().width === 32) != null ? _a : false;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, target, size, mutable = false) {
    return new _ArrayTypeNode(span, target, size, mutable);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var TupleTypeNode = class _TupleTypeNode extends Node {
  constructor(span, fields) {
    super();
    this.span = span;
    this.fields = fields;
    this.kind = "Tuple";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [...this.fields];
  }
  clone(newSpan) {
    const cloned = new _TupleTypeNode(newSpan || this.span, this.fields);
    return cloned;
  }
  toString() {
    return `(${this.fields.join(", ")})`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, fields) {
    return new _TupleTypeNode(span, fields);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var FunctionTypeNode = class _FunctionTypeNode extends Node {
  constructor(span, params, returnType, errorType) {
    super();
    this.span = span;
    this.params = params;
    this.returnType = returnType;
    this.errorType = errorType;
    this.kind = "Function";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(...this.params);
    if (this.returnType) {
      children.push(this.returnType);
    }
    if (this.errorType) {
      children.push(this.errorType);
    }
    return children;
  }
  clone(newSpan) {
    const cloned = new _FunctionTypeNode(newSpan || this.span, this.params, this.returnType, this.errorType);
    return cloned;
  }
  toString() {
    return `function`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, params, returnType, errorType) {
    return new _FunctionTypeNode(span, params, returnType, errorType);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var StructTypeNode = class _StructTypeNode extends Node {
  constructor(span, members, name = "Anonymous", metadata) {
    super();
    this.span = span;
    this.members = members;
    this.name = name;
    this.metadata = metadata;
    this.kind = "Struct";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(...this.members);
    return children;
  }
  clone(newSpan) {
    const cloned = new _StructTypeNode(newSpan || this.span, this.members, this.name, this.metadata);
    return cloned;
  }
  toString() {
    return `struct`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, members, name = "Anonymous", metadata = {}) {
    return new _StructTypeNode(span, members, name, metadata);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var EnumTypeNode = class _EnumTypeNode extends Node {
  constructor(span, variants, name = "Anonymous", metadata) {
    super();
    this.span = span;
    this.variants = variants;
    this.name = name;
    this.metadata = metadata;
    this.kind = "Enum";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(...this.variants);
    return children;
  }
  clone(newSpan) {
    const cloned = new _EnumTypeNode(newSpan || this.span, this.variants, this.name, this.metadata);
    return cloned;
  }
  toString() {
    return `enum`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, variants, name = "Anonymous", metadata = {}) {
    return new _EnumTypeNode(span, variants, name, metadata);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var UnionTypeNode = class _UnionTypeNode extends Node {
  constructor(span, types) {
    super();
    this.span = span;
    this.types = types;
    this.kind = "Union";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(...this.types);
    return children;
  }
  clone(newSpan) {
    const cloned = new _UnionTypeNode(newSpan || this.span, this.types);
    return cloned;
  }
  toString() {
    return `union`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, types) {
    return new _UnionTypeNode(span, types);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ErrsetTypeNode = class _ErrsetTypeNode extends Node {
  constructor(span, members) {
    super();
    this.span = span;
    this.members = members;
    this.kind = "errset";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(...this.members);
    return children;
  }
  clone(newSpan) {
    const cloned = new _ErrsetTypeNode(newSpan || this.span, this.members);
    return cloned;
  }
  toString() {
    return `error`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, members) {
    return new _ErrsetTypeNode(span, members);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
};
var ParenTypeNode = class _ParenTypeNode extends Node {
  constructor(span, type) {
    super();
    this.span = span;
    this.type = type;
    this.kind = "Paren";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.type];
  }
  clone(newSpan) {
    const cloned = new _ParenTypeNode(newSpan || this.span, this.type);
    return cloned;
  }
  toString() {
    return `paren`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, type) {
    return new _ParenTypeNode(span, type);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var TypeNode = class _TypeNode extends Node {
  constructor(span, kind, source) {
    super();
    this.span = span;
    this.kind = kind;
    this.source = source;
    this.level = 2;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return this.source ? this.source.getChildrenNodes() : [];
  }
  clone(newSpan) {
    return new _TypeNode(newSpan != null ? newSpan : this.span, this.kind, this.source);
  }
  toString() {
    var _a;
    return ((_a = this.source) == null ? void 0 : _a.toString()) || `Type(${this.kind})`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  is(kind) {
    return this.kind === kind;
  }
  isPrimitive() {
    return this.is("primitive");
  }
  isVoid() {
    return this.isPrimitive() && this.getPrimitive().isVoid();
  }
  isType() {
    return this.isPrimitive() && this.getPrimitive().isType();
  }
  isNull() {
    return this.isPrimitive() && this.getPrimitive().isNull();
  }
  isUndefined() {
    return this.isPrimitive() && this.getPrimitive().isUndefined();
  }
  isAny() {
    return this.isPrimitive() && this.getPrimitive().isAny();
  }
  isErr() {
    return this.isPrimitive() && this.getPrimitive().isErr();
  }
  isSigned() {
    return this.isPrimitive() && this.getPrimitive().isSigned();
  }
  isUnsigned() {
    return this.isPrimitive() && this.getPrimitive().isUnsigned();
  }
  isComptimeInt() {
    return this.isPrimitive() && this.getPrimitive().isComptimeInt();
  }
  isInteger() {
    return this.isPrimitive() && this.getPrimitive().isInteger();
  }
  isComptimeFloat() {
    return this.isPrimitive() && this.getPrimitive().isComptimeFloat();
  }
  isFloat() {
    return this.isPrimitive() && this.getPrimitive().isFloat();
  }
  isNumeric() {
    return this.isPrimitive() && this.getPrimitive().isNumeric();
  }
  isBool() {
    return this.isPrimitive() && this.getPrimitive().isBool();
  }
  isIdent() {
    return this.is("ident");
  }
  isPointer() {
    return this.kind === "pointer";
  }
  isOptional() {
    return this.kind === "optional";
  }
  isArray() {
    return this.kind === "array";
  }
  isU8Array() {
    return this.isArray() && this.getArray().isU8Array();
  }
  isU16Array() {
    return this.isArray() && this.getArray().isU16Array();
  }
  isU32Array() {
    return this.isArray() && this.getArray().isU32Array();
  }
  isTuple() {
    return this.kind === "tuple";
  }
  isFunction() {
    return this.kind === "function";
  }
  isStruct() {
    return this.kind === "struct";
  }
  isErrset() {
    return this.kind === "errset";
  }
  isEnum() {
    return this.kind === "enum";
  }
  isUnion() {
    return this.kind === "union";
  }
  isParen() {
    return this.kind === "paren";
  }
  getPrimitive() {
    return this.is("primitive") ? this.source : void 0;
  }
  getOptional() {
    return this.is("optional") ? this.source : void 0;
  }
  getPointer() {
    return this.is("pointer") ? this.source : void 0;
  }
  getArray() {
    return this.is("array") ? this.source : void 0;
  }
  getTuple() {
    return this.is("tuple") ? this.source : void 0;
  }
  getFunction() {
    return this.is("function") ? this.source : void 0;
  }
  getStruct() {
    return this.is("struct") ? this.source : void 0;
  }
  getError() {
    return this.is("errset") ? this.source : void 0;
  }
  getEnum() {
    return this.is("enum") ? this.source : void 0;
  }
  getUnion() {
    return this.is("union") ? this.source : void 0;
  }
  getParen() {
    return this.is("paren") ? this.source : void 0;
  }
  getIdent() {
    return this.is("ident") ? this.source : void 0;
  }
  getWidth() {
    return this.is("primitive") ? this.getPrimitive().width : void 0;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static asUnset(span) {
    return new _TypeNode(span || DEF_SPAN, "unset", null);
  }
  static asPrimitive(span, kind, text, width) {
    return new _TypeNode(span || DEF_SPAN, "primitive", PrimitiveTypeNode.create(kind, span || DEF_SPAN, text, width));
  }
  static asVoid(span) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "void");
  }
  static asBool(span) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "bool");
  }
  static asSigned(span, text, width) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "signed", text, width != null ? width : PrimitiveTypeNode.calcWidth("i", text));
  }
  static asUnsigned(span, text, width) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "unsigned", text, width != null ? width : PrimitiveTypeNode.calcWidth("u", text));
  }
  static asFloat(span, text, width) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "float", text, width != null ? width : PrimitiveTypeNode.calcWidth("f", text));
  }
  static asNull(span) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "null");
  }
  static asUndefined(span) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "und");
  }
  static asAny(span) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "any");
  }
  static asErr(span, text) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "err", text);
  }
  static asType(span) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "type");
  }
  static asComptimeInt(span, text) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "cint", text, 64);
  }
  static asComptimeFloat(span, text) {
    return _TypeNode.asPrimitive(span || DEF_SPAN, "cflt", text, 64);
  }
  static asIdentifier(span, name) {
    return new _TypeNode(span || DEF_SPAN, "ident", IdentNode.create(span || DEF_SPAN, name));
  }
  static asPointer(span, target, mutable = false) {
    return new _TypeNode(span || DEF_SPAN, "pointer", PointerTypeNode.create(span || DEF_SPAN, target, mutable));
  }
  static asOptional(span, target) {
    return new _TypeNode(span || DEF_SPAN, "optional", OptionalTypeNode.create(span || DEF_SPAN, target));
  }
  static asArray(span, target, size, mutable = false) {
    return new _TypeNode(span || DEF_SPAN, "array", ArrayTypeNode.create(span || DEF_SPAN, target, size, mutable));
  }
  static asU8Array(span, mutable = false) {
    return new _TypeNode(span || DEF_SPAN, "array", ArrayTypeNode.create(span || DEF_SPAN, _TypeNode.asUnsigned(span, "u8", 8), void 0, mutable));
  }
  static asU16Array(span, mutable = false) {
    return new _TypeNode(span || DEF_SPAN, "array", ArrayTypeNode.create(span || DEF_SPAN, _TypeNode.asUnsigned(span, "u16", 16), void 0, mutable));
  }
  static asU32Array(span, mutable = false) {
    return new _TypeNode(span || DEF_SPAN, "array", ArrayTypeNode.create(span || DEF_SPAN, _TypeNode.asUnsigned(span, "u32", 32), void 0, mutable));
  }
  static asTuple(span, fields) {
    return new _TypeNode(span || DEF_SPAN, "tuple", TupleTypeNode.create(span || DEF_SPAN, fields));
  }
  static asFunction(span, params, returnType, errorType) {
    return new _TypeNode(span || DEF_SPAN, "function", FunctionTypeNode.create(span || DEF_SPAN, params, returnType, errorType));
  }
  static asErrset(span, members) {
    return new _TypeNode(span || DEF_SPAN, "errset", ErrsetTypeNode.create(span || DEF_SPAN, members));
  }
  static asStruct(span, members, name = "Anonymous") {
    return new _TypeNode(span || DEF_SPAN, "struct", StructTypeNode.create(span || DEF_SPAN, members, name));
  }
  static asEnum(span, variants, name = "Anonymous") {
    return new _TypeNode(span || DEF_SPAN, "enum", EnumTypeNode.create(span || DEF_SPAN, variants, name));
  }
  static asUnion(span, types) {
    return new _TypeNode(span || DEF_SPAN, "union", UnionTypeNode.create(span || DEF_SPAN, types));
  }
  static asParen(span, type) {
    return new _TypeNode(span || DEF_SPAN, "paren", ParenTypeNode.create(span || DEF_SPAN, type));
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var PrimaryNode = class _PrimaryNode extends Node {
  constructor(kind, span, source) {
    super();
    this.kind = kind;
    this.span = span;
    this.source = source;
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.source);
    return children;
  }
  clone(newSpan) {
    const cloned = new _PrimaryNode(this.kind, newSpan || this.span, this.source);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  is(kind) {
    return this.kind === kind;
  }
  getLiteral() {
    return this.source;
  }
  getIdent() {
    return this.source;
  }
  getObject() {
    return this.source;
  }
  getParen() {
    return this.source;
  }
  getTuple() {
    return this.source;
  }
  getType() {
    return this.source;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(kind, span, source) {
    if (kind === "Ident" && !(source instanceof IdentNode)) {
      throw new Error(`Invalid kind for primary: ${kind}`);
    }
    if (kind === "Literal" && !(source instanceof LiteralNode)) {
      throw new Error(`Invalid kind for primary: ${kind}`);
    }
    if (kind === "Object" && !(source instanceof ObjectNode)) {
      throw new Error(`Invalid kind for primary: ${kind}`);
    }
    if (kind === "Paren" && !(source instanceof ParenNode)) {
      throw new Error(`Invalid kind for primary: ${kind}`);
    }
    if (kind === "Tuple" && !(source instanceof ExprTupleNode)) {
      throw new Error(`Invalid kind for primary: ${kind}`);
    }
    if (kind === "Type" && !(source instanceof TypeNode)) {
      throw new Error(`Invalid kind for primary: ${kind}`);
    }
    return new _PrimaryNode(kind, span, source);
  }
  static asIdent(span, name, builtin = false) {
    return this.create("Ident", span, IdentNode.create(span, name, builtin));
  }
  static asLiteral(kind, span, value) {
    return this.create("Literal", span, LiteralNode.create(kind, span, value));
  }
  static asParen(span, source) {
    return this.create("Paren", span, ParenNode.create(span, source));
  }
  static asObject(span, props, ident) {
    return this.create("Object", span, ObjectNode.create(span, props, ident));
  }
  static asTuple(span, exprs) {
    return this.create("Tuple", span, ExprTupleNode.create(span, exprs));
  }
  static asType(span, type) {
    return this.create("Type", span, type);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var MemberAccessNode = class _MemberAccessNode extends Node {
  constructor(span, base, target, optional) {
    super();
    this.span = span;
    this.base = base;
    this.target = target;
    this.optional = optional;
    this.kind = "MemberAccess";
    this.level = 5;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.base);
    children.push(this.target);
    return children;
  }
  clone(newSpan) {
    const cloned = new _MemberAccessNode(newSpan || this.span, this.base, this.target, this.optional);
    return cloned;
  }
  toString() {
    return `${this.base.toString()}${this.optional ? "?." : "."}${this.target.toString()}`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, base, target, optional = false) {
    return new _MemberAccessNode(span, base, target, optional);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ArrayAccessNode = class _ArrayAccessNode extends Node {
  constructor(span, base, index) {
    super();
    this.span = span;
    this.base = base;
    this.index = index;
    this.kind = "ArrayAccess";
    this.level = 5;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.base);
    children.push(this.index);
    return children;
  }
  clone(newSpan) {
    const cloned = new _ArrayAccessNode(newSpan || this.span, this.base, this.index);
    return cloned;
  }
  toString() {
    return `${this.base.toString()}[${this.index.toString()}]`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, base, index) {
    return new _ArrayAccessNode(span, base, index);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var CallNode = class _CallNode extends Node {
  constructor(span, base, args) {
    super();
    this.span = span;
    this.base = base;
    this.args = args;
    this.kind = "Call";
    this.level = 5;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.base);
    children.push(...this.args);
    return children;
  }
  clone(newSpan) {
    const cloned = new _CallNode(newSpan || this.span, this.base, this.args);
    return cloned;
  }
  toString() {
    const argsStr = this.args.map((arg) => arg.toString()).join(", ");
    return `${this.base.toString()}(${argsStr})`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, base, args) {
    return new _CallNode(span, base, args);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var PostfixNode = class _PostfixNode extends Node {
  constructor(kind, span, expr) {
    super();
    this.kind = kind;
    this.span = span;
    this.expr = expr;
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.expr);
    return children;
  }
  clone(newSpan) {
    const cloned = new _PostfixNode(this.kind, newSpan || this.span, this.expr);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  is(kind) {
    return this.kind === kind;
  }
  getCall() {
    return this.expr;
  }
  getMemberAccess() {
    return this.expr;
  }
  getArrayAccess() {
    return this.expr;
  }
  getAsExprNode() {
    if (this.is("Increment") || this.is("Decrement") || this.is("Dereference")) {
      return this.expr;
    }
    return void 0;
  }
  toString() {
    switch (this.kind) {
      case "Increment":
        return `${this.expr.toString()}++`;
      case "Decrement":
        return `${this.expr.toString()}--`;
      case "Dereference":
        return `*${this.expr.toString()}`;
      case "MemberAccess":
        return this.getMemberAccess().toString();
      case "ArrayAccess":
        return this.getArrayAccess().toString();
      case "Call":
        return this.getCall().toString();
      default:
        return `${this.expr.toString()}/* unknown postfix */`;
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(kind, span, expr) {
    return new _PostfixNode(kind, span, expr);
  }
  static asIncrement(span, base) {
    return _PostfixNode.create("Increment", span, base);
  }
  static asDecrement(span, base) {
    return _PostfixNode.create("Decrement", span, base);
  }
  static asDereference(span, base) {
    return _PostfixNode.create("Dereference", span, base);
  }
  static asMember(span, base, target, optional = false) {
    const memberExpr = MemberAccessNode.create(span, base, target, optional);
    return _PostfixNode.create("MemberAccess", span, memberExpr);
  }
  static asArrayAccess(span, base, index) {
    const arrayExpr = ArrayAccessNode.create(span, base, index);
    const node = _PostfixNode.create("ArrayAccess", span, arrayExpr);
    return node;
  }
  static asCall(span, base, args) {
    const callExpr = CallNode.create(span, base, args);
    return _PostfixNode.create("Call", span, callExpr);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var PrefixNode = class _PrefixNode extends Node {
  constructor(kind, span, expr) {
    super();
    this.kind = kind;
    this.span = span;
    this.expr = expr;
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.expr);
    return children;
  }
  clone(newSpan) {
    const cloned = new _PrefixNode(this.kind, newSpan || this.span, this.expr);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  is(kind) {
    return this.kind === kind;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(kind, span, expr) {
    return new _PrefixNode(kind, span, expr);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var op_table = {
  "**": "Power",
  "*": "Multiplicative",
  "/": "Multiplicative",
  "%": "Multiplicative",
  "+": "Additive",
  "-": "Additive",
  "<<": "Shift",
  ">>": "Shift",
  "<": "Relational",
  "<=": "Relational",
  ">": "Relational",
  ">=": "Relational",
  "==": "Equality",
  "!=": "Equality",
  "&": "BitwiseAnd",
  "^": "BitwiseXor",
  "|": "BitwiseOr",
  "and": "LogicalAnd",
  "or": "LogicalOr",
  "=": "Assignment",
  "+=": "Assignment",
  "-=": "Assignment",
  "*=": "Assignment",
  "/=": "Assignment",
  "%=": "Assignment"
};
var BinaryNode = class _BinaryNode extends Node {
  constructor(kind, span, left, operator, right) {
    super();
    this.kind = kind;
    this.span = span;
    this.left = left;
    this.operator = operator;
    this.right = right;
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.left);
    children.push(this.right);
    return children;
  }
  clone(newSpan) {
    const cloned = new _BinaryNode(this.kind, newSpan || this.span, this.left, this.operator, this.right);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  is(kind) {
    return this.kind === kind;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, left, operator, right) {
    const kind = op_table[operator];
    if (!kind) {
      throw new Error(`Unknown operator: ${operator}`);
    }
    return new _BinaryNode(kind, span, left, operator, right);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ConditionalNode = class _ConditionalNode extends Node {
  constructor(span, condExpr, trueExpr, falseExpr) {
    super();
    this.span = span;
    this.condExpr = condExpr;
    this.trueExpr = trueExpr;
    this.falseExpr = falseExpr;
    this.kind = "Conditional";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.condExpr);
    children.push(this.trueExpr);
    children.push(this.falseExpr);
    return children;
  }
  clone(newSpan) {
    const cloned = new _ConditionalNode(newSpan || this.span, this.condExpr, this.trueExpr, this.falseExpr);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, condExpr, trueExpr, falseExpr) {
    return new _ConditionalNode(span, condExpr, trueExpr, falseExpr);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var IfNode = class _IfNode extends Node {
  constructor(span, condExpr, thenStmt, elseStmt) {
    super();
    this.span = span;
    this.condExpr = condExpr;
    this.thenStmt = thenStmt;
    this.elseStmt = elseStmt;
    this.kind = "If";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.condExpr);
    children.push(this.thenStmt);
    if (this.elseStmt) {
      children.push(this.elseStmt);
    }
    return children;
  }
  clone(newSpan) {
    const cloned = new _IfNode(newSpan || this.span, this.condExpr, this.thenStmt, this.elseStmt);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, condExpr, thenStmt, elseStmt) {
    return new _IfNode(span, condExpr, thenStmt, elseStmt);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var SwitchNode = class _SwitchNode extends Node {
  constructor(span, condExpr, cases, defCase) {
    super();
    this.span = span;
    this.condExpr = condExpr;
    this.cases = cases;
    this.defCase = defCase;
    this.kind = "Switch";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.condExpr);
    for (const caseItem of this.cases) {
      children.push(...caseItem.getChildrenNodes());
    }
    if (this.defCase) {
      children.push(...this.defCase.getChildrenNodes());
    }
    return children;
  }
  clone(newSpan) {
    const cloned = new _SwitchNode(newSpan || this.span, this.condExpr, this.cases, this.defCase);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, condExpr, cases, defCase) {
    return new _SwitchNode(span, condExpr, cases, defCase);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var CatchNode = class _CatchNode extends Node {
  constructor(span, leftExpr, tag, rightStmt) {
    super();
    this.span = span;
    this.leftExpr = leftExpr;
    this.tag = tag;
    this.rightStmt = rightStmt;
    this.kind = "Catch";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.leftExpr);
    if (this.tag) {
      children.push(this.tag);
    }
    children.push(this.rightStmt);
    return children;
  }
  clone(newSpan) {
    const cloned = new _CatchNode(newSpan || this.span, this.leftExpr, this.tag, this.rightStmt);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, leftExpr, tag, rightStmt) {
    return new _CatchNode(span, leftExpr, tag, rightStmt);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var TryNode = class _TryNode extends Node {
  constructor(span, expr) {
    super();
    this.span = span;
    this.expr = expr;
    this.kind = "Try";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(this.expr);
    return children;
  }
  clone(newSpan) {
    const cloned = new _TryNode(newSpan || this.span, this.expr);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, leftExpr) {
    return new _TryNode(span, leftExpr);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var RangeNode = class _RangeNode extends Node {
  constructor(span, leftExpr, rangeType, rightExpr) {
    super();
    this.span = span;
    this.leftExpr = leftExpr;
    this.rangeType = rangeType;
    this.rightExpr = rightExpr;
    this.kind = "Range";
    this.level = 3;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    if (this.leftExpr) {
      children.push(this.leftExpr);
    }
    if (this.rightExpr) {
      children.push(this.rightExpr);
    }
    return children;
  }
  clone(newSpan) {
    const cloned = new _RangeNode(newSpan || this.span, this.leftExpr, this.rangeType, this.rightExpr);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, leftExpr, rangeType, elseStmt) {
    return new _RangeNode(span, leftExpr, rangeType, elseStmt);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var OrelseNode = class _OrelseNode extends Node {
  constructor(span, left, right) {
    super();
    this.span = span;
    this.left = left;
    this.right = right;
    this.level = 3;
    this.kind = "Orelse";
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.left, this.right];
  }
  clone(newSpan) {
    return new _OrelseNode(
      newSpan != null ? newSpan : this.span,
      this.left,
      this.right
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, left, right) {
    return new _OrelseNode(span, left, right);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var AsNode = class _AsNode extends Node {
  constructor(span, base, type) {
    super();
    this.span = span;
    this.base = base;
    this.type = type;
    this.level = 3;
    this.kind = "As";
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.base, this.type];
  }
  clone(newSpan) {
    return new _AsNode(
      newSpan != null ? newSpan : this.span,
      this.base,
      this.type
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, left, type) {
    return new _AsNode(span, left, type);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var TypeofNode = class _TypeofNode extends Node {
  constructor(span, expr) {
    super();
    this.span = span;
    this.expr = expr;
    this.level = 3;
    this.kind = "Typeof";
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.expr];
  }
  clone(newSpan) {
    return new _TypeofNode(
      newSpan != null ? newSpan : this.span,
      this.expr
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, expr) {
    return new _TypeofNode(span, expr);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var SizeofNode = class _SizeofNode extends Node {
  constructor(span, expr) {
    super();
    this.span = span;
    this.expr = expr;
    this.level = 3;
    this.kind = "Sizeof";
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return [this.expr];
  }
  clone(newSpan) {
    return new _SizeofNode(
      newSpan != null ? newSpan : this.span,
      this.expr
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, expr) {
    return new _SizeofNode(span, expr);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ExprNode = class _ExprNode extends Node {
  constructor(kind, span, data) {
    super();
    this.kind = kind;
    this.span = span;
    this.data = data;
    this.level = 2;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    return this.data.getChildrenNodes();
  }
  clone(newSpan) {
    const cloned = new _ExprNode(this.kind, newSpan != null ? newSpan : this.span, this.data);
    return cloned;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  getPrimary() {
    return this.is("Primary") ? this.data : void 0;
  }
  getPostfix() {
    return this.is("Postfix") ? this.data : void 0;
  }
  getPrefix() {
    return this.is("Prefix") ? this.data : void 0;
  }
  getBinary() {
    return this.is("Binary") ? this.data : void 0;
  }
  getConditional() {
    return this.is("Cond") ? this.data : void 0;
  }
  getIf() {
    return this.is("If") ? this.data : void 0;
  }
  getSwitch() {
    return this.is("Switch") ? this.data : void 0;
  }
  getCatch() {
    return this.is("Catch") ? this.data : void 0;
  }
  getTry() {
    return this.is("Try") ? this.data : void 0;
  }
  getRange() {
    return this.is("Range") ? this.data : void 0;
  }
  getOrelse() {
    return this.is("Orelse") ? this.data : void 0;
  }
  getAs() {
    return this.is("As") ? this.data : void 0;
  }
  getTypeof() {
    return this.is("Typeof") ? this.data : void 0;
  }
  getSizeof() {
    return this.is("Sizeof") ? this.data : void 0;
  }
  getLiteral() {
    return this.is("Primary") && this.getPrimary().is("Literal") ? this.getPrimary().getLiteral() : void 0;
  }
  getIdent() {
    return this.is("Primary") && this.getPrimary().is("Ident") ? this.getPrimary().getIdent() : void 0;
  }
  getParen() {
    return this.is("Primary") && this.getPrimary().is("Paren") ? this.getPrimary().getParen() : void 0;
  }
  getObject() {
    return this.is("Primary") && this.getPrimary().is("Object") ? this.getPrimary().getObject() : void 0;
  }
  getTuple() {
    return this.is("Primary") && this.getPrimary().is("Tuple") ? this.getPrimary().getTuple() : void 0;
  }
  getType() {
    return this.is("Primary") && this.getPrimary().is("Type") ? this.getPrimary().getType() : void 0;
  }
  is(kind) {
    return this.kind === kind;
  }
  isOrEndWith(kind) {
    return this.is(kind) || this.isParen() && this.getParen().source.isOrEndWith(kind) || false;
  }
  isIdent() {
    return this.is("Primary") && this.getPrimary().is("Ident");
  }
  isLiteral() {
    return this.is("Primary") && this.getPrimary().is("Literal");
  }
  isObject() {
    return this.is("Primary") && this.getPrimary().is("Object");
  }
  isParen() {
    return this.is("Primary") && this.getPrimary().is("Paren");
  }
  isTuple() {
    return this.is("Primary") && this.getPrimary().is("Tuple");
  }
  isType() {
    return this.is("Primary") && this.getPrimary().is("Type");
  }
  isMemberAccess() {
    return this.is("Postfix") && this.getPostfix().is("MemberAccess");
  }
  isArrayAccess() {
    return this.is("Postfix") && this.getPostfix().is("ArrayAccess");
  }
  isCall() {
    return this.is("Postfix") && this.getPostfix().is("Call");
  }
  isOrelse() {
    return this.is("Orelse");
  }
  isAs() {
    return this.is("As");
  }
  isTypeof() {
    return this.is("Typeof");
  }
  isSizeof() {
    return this.is("Sizeof");
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  // ────────────────────────── Primary ──────────────────────────
  static asPrimary(span, source) {
    return new _ExprNode("Primary", span, source);
  }
  static asLiteral(span, kind, value) {
    return _ExprNode.asPrimary(span || DEF_SPAN, PrimaryNode.asLiteral(kind, span, value));
  }
  static asIdent(span, name, builtin = false) {
    return _ExprNode.asPrimary(span || DEF_SPAN, PrimaryNode.asIdent(span || DEF_SPAN, name, builtin));
  }
  static asType(span, type) {
    return _ExprNode.asPrimary(span || DEF_SPAN, PrimaryNode.asType(span || DEF_SPAN, type));
  }
  static asInteger(span, value) {
    return this.asLiteral(span || DEF_SPAN, "Integer", value);
  }
  static asFloat(span, value) {
    return this.asLiteral(span || DEF_SPAN, "Float", value);
  }
  static asBool(span, value) {
    return this.asLiteral(span || DEF_SPAN, "Bool", value);
  }
  static asNull(span) {
    return this.asLiteral(span || DEF_SPAN, "Null", null);
  }
  static asUndefined(span) {
    return this.asLiteral(span || DEF_SPAN, "Undefined", void 0);
  }
  static asString(span, value) {
    return this.asLiteral(span || DEF_SPAN, "String", value);
  }
  static asChar(span, value) {
    return this.asLiteral(span || DEF_SPAN, "Character", value);
  }
  static asArray(span, elements) {
    return this.asLiteral(span || DEF_SPAN, "Array", [...elements]);
  }
  static asObject(span, props, ident) {
    return _ExprNode.asPrimary(span || DEF_SPAN, PrimaryNode.asObject(span || DEF_SPAN, props, ident));
  }
  static asParen(span, expression) {
    return _ExprNode.asPrimary(span || DEF_SPAN, PrimaryNode.asParen(span || DEF_SPAN, expression));
  }
  static asTuple(span, fields) {
    return _ExprNode.asPrimary(span || DEF_SPAN, PrimaryNode.asTuple(span || DEF_SPAN, fields));
  }
  // ────────────────────────── Postfix ──────────────────────────
  static asPostfix(span, source) {
    return new _ExprNode("Postfix", span, source);
  }
  static asPostIncrement(span, base) {
    return _ExprNode.asPostfix(span || DEF_SPAN, PostfixNode.asIncrement(span || DEF_SPAN, base));
  }
  static asPostDecrement(span, base) {
    return _ExprNode.asPostfix(span || DEF_SPAN, PostfixNode.asDecrement(span || DEF_SPAN, base));
  }
  static asDereference(span, base) {
    return _ExprNode.asPostfix(span || DEF_SPAN, PostfixNode.asDereference(span || DEF_SPAN, base));
  }
  static asMemberAccess(span, base, target, optional = false) {
    return _ExprNode.asPostfix(span || DEF_SPAN, PostfixNode.asMember(span || DEF_SPAN, base, target, optional));
  }
  static asCall(span, base, args) {
    return _ExprNode.asPostfix(span || DEF_SPAN, PostfixNode.asCall(span || DEF_SPAN, base, args));
  }
  static asArrayAccess(span, base, index) {
    return _ExprNode.asPostfix(span || DEF_SPAN, PostfixNode.asArrayAccess(span || DEF_SPAN, base, index));
  }
  // ────────────────────────── Prefix ──────────────────────────
  static asPrefix(span, source) {
    return new _ExprNode("Prefix", span, source);
  }
  static asPreIncrement(span, base) {
    return _ExprNode.asPrefix(span || DEF_SPAN, PrefixNode.create("Increment", span, base));
  }
  static asPreDecrement(span, base) {
    return _ExprNode.asPrefix(span || DEF_SPAN, PrefixNode.create("Decrement", span, base));
  }
  static asReference(span, base) {
    return _ExprNode.asPrefix(span || DEF_SPAN, PrefixNode.create("Reference", span, base));
  }
  static asUnaryMinus(span, base) {
    return _ExprNode.asPrefix(span || DEF_SPAN, PrefixNode.create("UnaryMinus", span, base));
  }
  static asUnaryPlus(span, base) {
    return _ExprNode.asPrefix(span || DEF_SPAN, PrefixNode.create("UnaryPlus", span, base));
  }
  static asLogicalNot(span, base) {
    return _ExprNode.asPrefix(span || DEF_SPAN, PrefixNode.create("LogicalNot", span, base));
  }
  static asxBitwiseNot(span, base) {
    return _ExprNode.asPrefix(span || DEF_SPAN, PrefixNode.create("BitwiseNot", span, base));
  }
  // ────────────────────────── Rest ──────────────────────────
  static asBinary(span, left, operator, right) {
    return new _ExprNode("Binary", span, BinaryNode.create(span || DEF_SPAN, left, operator, right));
  }
  static asConditional(span, condExpr, trueExpr, falseExpr) {
    return new _ExprNode("Cond", span, ConditionalNode.create(span || DEF_SPAN, condExpr, trueExpr, falseExpr));
  }
  static asIf(span, condExpr, thenStmt, elseStmt) {
    return new _ExprNode("If", span, IfNode.create(span || DEF_SPAN, condExpr, thenStmt, elseStmt));
  }
  static asSwitch(span, condExpr, cases, defCase) {
    return new _ExprNode("Switch", span, SwitchNode.create(span || DEF_SPAN, condExpr, cases, defCase));
  }
  static asCatch(span, leftExpr, tag, rightStmt) {
    return new _ExprNode("Catch", span, CatchNode.create(span || DEF_SPAN, leftExpr, tag, rightStmt));
  }
  static asTry(span, expr) {
    return new _ExprNode("Try", span, TryNode.create(span || DEF_SPAN, expr));
  }
  static asRange(span, leftExpr, rangeType, rightExpr) {
    return new _ExprNode("Range", span, RangeNode.create(span || DEF_SPAN, leftExpr, rangeType, rightExpr));
  }
  static asOrelse(span, left, right) {
    return new _ExprNode("Orelse", span, OrelseNode.create(span || DEF_SPAN, left, right));
  }
  static asAs(span, base, type) {
    return new _ExprNode("As", span, AsNode.create(span || DEF_SPAN, base, type));
  }
  static asTypeof(span, type) {
    return new _ExprNode("Typeof", span, TypeofNode.create(span || DEF_SPAN, type));
  }
  static asSizeof(span, type) {
    return new _ExprNode("Sizeof", span, SizeofNode.create(span || DEF_SPAN, type));
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var ExprTupleNode = class _ExprTupleNode extends Node {
  constructor(span, fields) {
    super();
    this.span = span;
    this.fields = fields;
    this.kind = "Tuple";
    this.level = 4;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    children.push(...this.fields);
    return children;
  }
  clone(newSpan) {
    const cloned = new _ExprTupleNode(newSpan || this.span, this.fields);
    return cloned;
  }
  toString() {
    return `{ ${this.fields.map((f) => `f${f.getIdent().name}`).join(", ")} }`;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, fields) {
    return new _ExprTupleNode(span, fields);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var FieldNode = class _FieldNode extends Node {
  constructor(span, visibility, comptime, mutability, ident, type, initializer) {
    super();
    this.span = span;
    this.visibility = visibility;
    this.comptime = comptime;
    this.mutability = mutability;
    this.ident = ident;
    this.type = type;
    this.initializer = initializer;
    this.level = 5;
    this.kind = "Field";
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    if (this.type) {
      children.push(this.type);
    }
    if (this.initializer) {
      children.push(this.initializer);
    }
    return children;
  }
  clone(newSpan) {
    return new _FieldNode(
      newSpan != null ? newSpan : this.span,
      this.visibility,
      this.comptime,
      this.mutability,
      this.ident,
      this.type,
      this.initializer
    );
  }
  // for factory
  getField() {
    return this;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, visibility, comptime, mutability, ident, type, initializer) {
    return new _FieldNode(span, visibility, comptime, mutability, ident, type, initializer);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  // └────────────────────────────────────────────────────────────────────┘
};
var StructMemberNode = class _StructMemberNode extends Node {
  constructor(span, kind, source) {
    super();
    this.span = span;
    this.kind = kind;
    this.source = source;
    this.level = 5;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── NODE ──────────────────────────────┐
  getChildrenNodes() {
    const children = [];
    if (this.source) children.push(this.source);
    return children;
  }
  clone(newSpan) {
    return new _StructMemberNode(
      newSpan != null ? newSpan : this.span,
      this.kind,
      this.source
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  isField() {
    return this.kind === "Field";
  }
  isMethod() {
    return this.kind === "Method";
  }
  getField() {
    if (this.isField()) return this.source;
    return void 0;
  }
  getMethod() {
    if (this.isMethod()) return this.source;
    return void 0;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(span, source) {
    return new _StructMemberNode(span, source.kind === "Function" ? "Method" : "Field", source);
  }
  static createField(span, structFieldNode) {
    return new _StructMemberNode(span, "Field", structFieldNode);
  }
  static createMethod(span, funcNode) {
    return new _StructMemberNode(span, "Method", funcNode);
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var __defProp2 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp2(a, prop, b[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b)) {
      if (__propIsEnum2.call(b, prop))
        __defNormalProp2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var DiagCode = /* @__PURE__ */ ((DiagCode2) => {
  DiagCode2["INTERNAL_ERROR"] = "INTERNAL_ERROR";
  DiagCode2["PARSER_ERROR"] = "PARSER_ERROR";
  DiagCode2["MODULE_SCOPE_NOT_FOUND"] = "MODULE_SCOPE_NOT_FOUND";
  DiagCode2["MODULE_NOT_FOUND"] = "MODULE_NOT_FOUND";
  DiagCode2["TYPE_INFERENCE_FAILED"] = "TYPE_INFERENCE_FAILED";
  DiagCode2["OPTIMIZATION_HINT"] = "OPTIMIZATION_HINT";
  DiagCode2["SYMBOL_NOT_FOUND"] = "SYMBOL_NOT_FOUND";
  DiagCode2["ANONYMOUS_STRUCT"] = "ANONYMOUS_STRUCT";
  DiagCode2["TYPE_CYCLE_DETECTED"] = "TYPE_CYCLE_DETECTE";
  DiagCode2["TYPE_NESTING_TOO_DEEP"] = "TYPE_NESTING_TOO_DEEP";
  DiagCode2["SYMBOL_NOT_EXPORTED"] = "SYMBOL_NOT_EXPORTED";
  DiagCode2["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
  DiagCode2["INVALID_VISIBILITY"] = "INVALID_VISIBILITY";
  DiagCode2["INVALID_TYPE_WIDTH"] = "INVALID_TYPE_WIDTH";
  DiagCode2["MISSING_RETURN_STATEMENT"] = "MISSING_RETURN_STATEMENT";
  DiagCode2["INVALID_STATIC_ACCESS"] = "INVALID_STATIC_ACCESS";
  DiagCode2["SYMBOL_NOT_ACCESSIBLE"] = "SYMBOL_NOT_ACCESSIBLE";
  DiagCode2["INVALID_SIZEOF_TARGET"] = "INVALID_SIZEOF_TARGET";
  DiagCode2["THROW_WITHOUT_ERROR_TYPE"] = "THROW_WITHOUT_ERROR_TYPE";
  DiagCode2["THROW_TYPE_MISMATCH"] = "THROW_TYPE_MISMATCH";
  DiagCode2["THROW_OUTSIDE_FUNCTION"] = "THROW_OUTSIDE_FUNCTION";
  DiagCode2["INVALID_ERROR_TYPE"] = "INVALID_ERROR_TYPE";
  DiagCode2["TYPE_VALIDATION_FAILED"] = "TYPE_VALIDATION_FAILED";
  DiagCode2["INVALID_TYPE_OPERATION"] = "INVALID_TYPE_OPERATION";
  DiagCode2["TYPE_INCOMPATIBLE"] = "TYPE_INCOMPATIBLE";
  DiagCode2["TYPE_INFERENCE_ERROR"] = "TYPE_INFERENCE_ERROR";
  DiagCode2["NULL_POINTER_ERROR"] = "NULL_POINTER_ERROR";
  DiagCode2["TYPE_SAFETY_ERROR"] = "TYPE_SAFETY_ERROR";
  DiagCode2["SYNTAX_ERROR"] = "SYNTAX_ERROR";
  DiagCode2["ANALYSIS_ERROR"] = "ANALYSIS_ERROR";
  DiagCode2["ENTRY_MODULE_NOT_FOUND"] = "ENTRY_MODULE_NOT_FOUND";
  DiagCode2["ENTRY_MODULE_NO_MAIN"] = "ENTRY_MODULE_NO_MAIN";
  DiagCode2["ENTRY_MODULE_PRIVATE_MAIN"] = "ENTRY_MODULE_PRIVATE_MAIN";
  DiagCode2["TYPE_MISMATCH"] = "TYPE_MISMATCH";
  DiagCode2["ARRAY_TO_NON_ARRAY"] = "ARRAY_TO_NON_ARRAY";
  DiagCode2["NON_ARRAY_TO_ARRAY"] = "NON_ARRAY_TO_ARRAY";
  DiagCode2["BOOL_TO_NON_BOOL"] = "BOOL_TO_NON_BOOL";
  DiagCode2["NON_BOOL_TO_BOOL"] = "NON_BOOL_TO_BOOL";
  DiagCode2["NEGATIVE_TO_UNSIGNED"] = "NEGATIVE_TO_UNSIGNED";
  DiagCode2["LITERAL_OVERFLOW"] = "LITERAL_OVERFLOW";
  DiagCode2["CANNOT_INFER_TYPE"] = "CANNOT_INFER_TYPE";
  DiagCode2["UNDEFINED_IDENTIFIER"] = "UNDEFINED_IDENTIFIER";
  DiagCode2["UNDEFINED_BUILTIN"] = "UNDEFINED_BUILTIN";
  DiagCode2["UNDEFINED_FUNCTION"] = "UNDEFINED_FUNCTION";
  DiagCode2["NOT_A_FUNCTION"] = "NOT_A_FUNCTION";
  DiagCode2["USED_BEFORE_DECLARED"] = "USED_BEFORE_DECLARED";
  DiagCode2["USED_BEFORE_INITIALIZED"] = "USED_BEFORE_INITIALIZED";
  DiagCode2["UNDEFINED_TYPE"] = "UNDEFINED_TYPE";
  DiagCode2["UNSUPPORTED_TYPE"] = "UnsupportedType";
  DiagCode2["VARIABLE_SELF_INIT"] = "VARIABLE_SELF_INIT";
  DiagCode2["PARAMETER_SELF_INIT"] = "PARAMETER_SELF_INIT";
  DiagCode2["PARAMETER_FORWARD_REFERENCE"] = "PARAMETER_FORWARD_REFERENCE";
  DiagCode2["USE_SHADOWING"] = "USE_SHADOWING";
  DiagCode2["DEFINITION_SHADOWING"] = "DEFINITION_SHADOWING";
  DiagCode2["VARIABLE_SHADOWING"] = "VARIABLE_SHADOWING";
  DiagCode2["FUNCTION_SHADOWING"] = "FUNCTION_SHADOWING";
  DiagCode2["PARAMETER_SHADOWING"] = "PARAMETER_SHADOWING";
  DiagCode2["STRUCT_FIELD_SHADOWING"] = "STRUCT_FIELD_SHADOWING";
  DiagCode2["ENUM_VARIANT_SHADOWING"] = "ENUM_VARIANT_SHADOWING";
  DiagCode2["ERROR_SHADOWING"] = "ERROR_SHADOWING";
  DiagCode2["DUPLICATE_SYMBOL"] = "DUPLICATE_SYMBOL";
  DiagCode2["TOO_FEW_ARGUMENTS"] = "TOO_FEW_ARGUMENTS";
  DiagCode2["TOO_MANY_ARGUMENTS"] = "TOO_MANY_ARGUMENTS";
  DiagCode2["UNUSED_VARIABLE"] = "UNUSED_VARIABLE";
  DiagCode2["UNUSED_PARAMETER"] = "UNUSED_PARAMETER";
  DiagCode2["UNUSED_FUNCTION"] = "UNUSED_FUNCTION";
  DiagCode2["UNARY_MINUS_NON_NUMERIC"] = "UNARY_MINUS_NON_NUMERIC";
  DiagCode2["UNARY_PLUS_NON_NUMERIC"] = "UNARY_PLUS_NON_NUMERIC";
  DiagCode2["IMPORT_NOT_FOUND"] = "IMPORT_NOT_FOUND";
  DiagCode2["IMPORT_CIRCULAR_DEPENDENCY"] = "IMPORT_CIRCULAR_DEPENDENCY";
  DiagCode2["IMPORT_PRIVATE_SYMBOL"] = "IMPORT_PRIVATE_SYMBOL";
  DiagCode2["NEGATIVE_SHIFT"] = "NEGATIVE_SHIFT";
  DiagCode2["SHIFT_OVERFLOW"] = "SHIFT_OVERFLOW";
  DiagCode2["SHIFT_RESULT_OVERFLOW"] = "SHIFT_RESULT_OVERFLOW";
  DiagCode2["ARITHMETIC_OVERFLOW"] = "ARITHMETIC_OVERFLOW";
  DiagCode2["POTENTIAL_OVERFLOW"] = "POTENTIAL_OVERFLOW";
  DiagCode2["DIVISION_BY_ZERO"] = "DIVISION_BY_ZERO";
  DiagCode2["MODULO_BY_ZERO"] = "MODULO_BY_ZERO";
  DiagCode2["PRECISION_LOSS"] = "PRECISION_LOSS";
  DiagCode2["ARITHMETIC_ERROR"] = "ARITHMETIC_ERROR";
  DiagCode2["ARRAY_SIZE_MISMATCH"] = "ARRAY_SIZE_MISMATCH";
  DiagCode2["MUTABILITY_MISMATCH"] = "MUTABILITY_MISMATCH";
  DiagCode2["POTENTIAL_PRECISION_LOSS"] = "POTENTIAL_PRECISION_LOSS";
  DiagCode2["POTENTIAL_DATA_LOSS"] = "POTENTIAL_DATA_LOSS";
  return DiagCode2;
})(DiagCode || {});
var DiagKind = /* @__PURE__ */ ((DiagKind2) => {
  DiagKind2["ERROR"] = "error";
  DiagKind2["WARNING"] = "warning";
  DiagKind2["INFO"] = "info";
  return DiagKind2;
})(DiagKind || {});
var DiagnosticManager = class {
  constructor(contextTracker, strictMode = false) {
    this.diagnostics = [];
    this.strictMode = strictMode;
    this.contextTracker = contextTracker;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  push(diagnostic) {
    if (!diagnostic.sourceModuleName) {
      diagnostic.sourceModuleName = this.contextTracker.getModuleName();
    }
    if (!diagnostic.sourceModulePath) {
      const ctxPath = this.contextTracker.getModulePath();
      if (ctxPath && ctxPath.length > 0) {
        diagnostic.sourceModulePath = ctxPath;
      } else {
        const moduleName = this.contextTracker.getModuleName();
        if (moduleName && moduleName.length > 0) {
          diagnostic.sourceModulePath = `./${moduleName}`;
        }
      }
    }
    if (!diagnostic.contextSpan) {
      diagnostic.contextSpan = this.contextTracker.getContextSpan();
    }
    if (this.strictMode && this.diagnostics.length > 0 && diagnostic.kind === "error") {
      return;
    }
    this.diagnostics.push(diagnostic);
  }
  reportError(code, msg, targetSpan) {
    this.push({ code, kind: "error", msg, targetSpan });
  }
  reportWarning(code, msg, targetSpan) {
    this.push({ code, kind: "warning", msg, targetSpan });
  }
  reportInfo(code, msg, targetSpan) {
    this.push({ code, kind: "info", msg, targetSpan });
  }
  addErrorDiagnostic(diagnostic) {
    this.push({
      code: "ANALYSIS_ERROR",
      kind: diagnostic.severity === "error" ? "error" : diagnostic.severity === "warning" ? "warning" : "info",
      msg: diagnostic.message
    });
  }
  getDiagnostics() {
    return this.filterDuplicates(this.diagnostics);
  }
  reset() {
    this.diagnostics = [];
  }
  hasErrors() {
    return this.diagnostics.some(
      (d) => d.kind === "error"
      /* ERROR */
    );
  }
  length() {
    return this.diagnostics.length;
  }
  getAllErrors() {
    return this.diagnostics.filter(
      (d) => d.kind === "error"
      /* ERROR */
    );
  }
  getAllWarnings() {
    return this.diagnostics.filter(
      (d) => d.kind === "warning"
      /* WARNING */
    );
  }
  getAllInfos() {
    return this.diagnostics.filter(
      (d) => d.kind === "info"
      /* INFO */
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  getContextKey(diagnostic) {
    return diagnostic.contextSpan ? `c:${diagnostic.contextSpan.start}-${diagnostic.contextSpan.end}` : "no-context";
  }
  isMoreSpecific(d1, d2) {
    if (d1.msg.length !== d2.msg.length) {
      return d1.msg.length > d2.msg.length;
    }
    const context1Size = d1.contextSpan ? d1.contextSpan.end - d1.contextSpan.start : 0;
    const context2Size = d2.contextSpan ? d2.contextSpan.end - d2.contextSpan.start : 0;
    if (context1Size !== context2Size) {
      return context1Size > context2Size;
    }
    return this.hasHigherPriority(d1, d2);
  }
  hasHigherPriority(d1, d2) {
    const priority = { error: 2, warning: 1, info: 0 };
    return (priority[d1.kind] || 0) > (priority[d2.kind] || 0);
  }
  filterDuplicates(diagnostics) {
    const seen = /* @__PURE__ */ new Map();
    for (const diagnostic of diagnostics) {
      let foundDuplicate = false;
      let duplicateKey = null;
      for (const [key, existingDiagnostic] of seen.entries()) {
        if (this.isSameIssue(diagnostic, existingDiagnostic)) {
          foundDuplicate = true;
          duplicateKey = key;
          break;
        }
      }
      if (!foundDuplicate) {
        const targetKey = this.getTargetKey(diagnostic);
        seen.set(targetKey, diagnostic);
      } else if (duplicateKey) {
        const existing = seen.get(duplicateKey);
        if (this.isMoreSpecific(diagnostic, existing)) {
          seen.set(duplicateKey, diagnostic);
        }
      }
    }
    return Array.from(seen.values());
  }
  getTargetKey(diagnostic) {
    const targetKey = diagnostic.targetSpan ? `t:${diagnostic.targetSpan.start}-${diagnostic.targetSpan.end}` : "no-target";
    return targetKey;
  }
  isSameIssue(d1, d2) {
    var _a, _b;
    const target1 = d1.targetSpan ? `${d1.targetSpan.start}-${d1.targetSpan.end}` : "no-target";
    const target2 = d2.targetSpan ? `${d2.targetSpan.start}-${d2.targetSpan.end}` : "no-target";
    if (target1 !== target2) {
      return false;
    }
    const identifierPatterns = [
      /identifier '([^']+)'/i,
      /Symbol '([^']+)'/i,
      /'([^']+)' already imported/i,
      /'([^']+)' shadows use/i
    ];
    let id1 = null;
    let id2 = null;
    for (const pattern of identifierPatterns) {
      id1 = id1 || ((_a = d1.msg.match(pattern)) == null ? void 0 : _a[1]) || null;
      id2 = id2 || ((_b = d2.msg.match(pattern)) == null ? void 0 : _b[1]) || null;
    }
    if (id1 && id2 && id1 === id2) {
      return true;
    }
    const isDuplicateRelated = (code) => code === "DUPLICATE_SYMBOL" || code === "USE_SHADOWING" || code === "VARIABLE_SHADOWING" || code === "FUNCTION_SHADOWING" || code === "DEFINITION_SHADOWING" || code === "PARAMETER_SHADOWING";
    if (isDuplicateRelated(d1.code) && isDuplicateRelated(d2.code)) {
      return true;
    }
    return false;
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var AnalysisPhase = /* @__PURE__ */ ((AnalysisPhase2) => {
  AnalysisPhase2["Collection"] = "Collection";
  AnalysisPhase2["Resolution"] = "Resolution";
  AnalysisPhase2["TypeValidation"] = "TypeValidation";
  AnalysisPhase2["SemanticValidation"] = "SemanticValidation";
  AnalysisPhase2["FinalValidation"] = "FinalValidation";
  return AnalysisPhase2;
})(AnalysisPhase || {});
var ContextTracker = class {
  constructor(debugManager, diagnosticManager) {
    this.debugManager = debugManager;
    this.diagnosticManager = diagnosticManager;
    this.context = this.genAnalysisContext();
    this.currentPhase = "Collection";
    this.phaseStack = [];
    this.contextMap = /* @__PURE__ */ new Map();
  }
  init() {
    this.reset();
  }
  reset() {
    this.context = this.genAnalysisContext();
    this.currentPhase = "Collection";
    this.phaseStack = [];
    this.contextMap.clear();
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  genAnalysisContext() {
    return {
      currentModuleName: "",
      currentModulePath: "",
      currentPhase: "Collection",
      contextSpanStack: [],
      declarationStack: [],
      expressionStack: [],
      currentScope: 0,
      processingSymbols: /* @__PURE__ */ new Set(),
      pendingReferences: /* @__PURE__ */ new Map(),
      resolvedSymbols: /* @__PURE__ */ new Set()
    };
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────── STATE SAVE/RESTORE (NEW) ──────────────────┐
  /**
   * Save the current context state before entering a new scope/context.
   * This captures all relevant state that needs to be restored later.
   */
  saveState() {
    var _a;
    const state = {
      scopeId: this.context.currentScope,
      moduleName: this.context.currentModuleName,
      modulePath: this.context.currentModulePath,
      spanStackDepth: this.context.contextSpanStack.length,
      declarationStackDepth: this.context.declarationStack.length,
      expressionStackDepth: this.context.expressionStack.length
    };
    (_a = this.debugManager) == null ? void 0 : _a.log(
      "verbose",
      `\u{1F4BE} Saved context state: scope=${state.scopeId}, module=${state.moduleName}, spans=${state.spanStackDepth}`
    );
    return state;
  }
  /**
   * Restore with validation to catch state corruption
   */
  restoreState(state) {
    var _a, _b;
    (_a = this.debugManager) == null ? void 0 : _a.log(
      "verbose",
      `\u267B\uFE0F  Restoring context state: scope=${state.scopeId}, module=${state.moduleName}`
    );
    if (!this.validateSavedState(state)) {
      (_b = this.debugManager) == null ? void 0 : _b.log("errors", `\u26A0\uFE0F  Invalid saved state detected, attempting recovery`);
    }
    this.context.currentScope = state.scopeId;
    this.context.currentModuleName = state.moduleName;
    this.context.currentModulePath = state.modulePath;
    this.restoreStack(this.context.contextSpanStack, state.spanStackDepth, "contextSpan");
    this.restoreStack(this.context.expressionStack, state.expressionStackDepth, "expression");
    while (this.context.declarationStack.length > state.declarationStackDepth) {
      const decl = this.context.declarationStack.pop();
      if (decl) {
        this.context.processingSymbols.delete(decl.symbolId);
      }
    }
  }
  restoreStack(stack, targetDepth, name) {
    var _a;
    if (stack.length < targetDepth) {
      (_a = this.debugManager) == null ? void 0 : _a.log(
        "errors",
        `\u26A0\uFE0F Stack underflow for ${name}: current=${stack.length}, target=${targetDepth}. Clearing stack.`
      );
      stack.length = 0;
      return;
    }
    while (stack.length > targetDepth) {
      stack.pop();
    }
  }
  validateSavedState(state) {
    if (state.scopeId < 0) return false;
    if (state.spanStackDepth < 0) return false;
    if (state.declarationStackDepth < 0) return false;
    if (state.expressionStackDepth < 0) return false;
    return true;
  }
  /**
   * Execute a function with saved/restored context.
   * This is a convenience wrapper that automatically handles state management.
   *
   * Usage:
   * ```typescript
   * contextTracker.withSavedState(() => {
   *     // Do work that changes context
   *     contextTracker.setScope(newScope);
   *     processNode(node);
   * });
   * // Context is automatically restored here
   * ```
   */
  withSavedState(fn) {
    const savedState = this.saveState();
    try {
      return fn();
    } finally {
      this.restoreState(savedState);
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────── MODULE & PHASE ────────────────────────┐
  setModuleName(moduleName) {
    var _a;
    this.context.currentModuleName = moduleName;
    (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Set module name to '${moduleName}'`);
  }
  setModulePath(modulePath) {
    var _a;
    this.context.currentModulePath = modulePath;
    (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Set module path to '${modulePath}'`);
  }
  pushPhase(phase) {
    var _a;
    this.phaseStack.push(this.currentPhase);
    this.setPhase(phase);
    (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Pushed phase '${phase}' (stack: ${this.phaseStack.length})`);
  }
  popPhase() {
    var _a;
    const previousPhase = this.phaseStack.pop();
    if (previousPhase) {
      this.setPhase(previousPhase);
      (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Popped phase, returned to '${previousPhase}'`);
    }
    return previousPhase;
  }
  setPhase(phase) {
    var _a;
    this.currentPhase = phase;
    this.context.currentPhase = phase;
    (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Entered phase '${phase}'`);
  }
  getCurrentPhase() {
    return this.context.currentPhase;
  }
  setScope(scopeId) {
    this.context.currentScope = scopeId;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────── CONTEXT SPAN MANAGEMENT ────────────────────┐
  setCurrentContextSpan(span) {
    var _a, _b;
    if (span) {
      this.context.contextSpanStack.push(span);
      (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Pushed span [${span.start}-${span.end}] (stack depth: ${this.context.contextSpanStack.length})`);
    } else {
      if (this.context.contextSpanStack.length > 0) {
        const removed = this.context.contextSpanStack.pop();
        (_b = this.debugManager) == null ? void 0 : _b.log("verbose", `Context: Popped span [${removed == null ? void 0 : removed.start}-${removed == null ? void 0 : removed.end}] (stack depth: ${this.context.contextSpanStack.length})`);
      }
    }
  }
  pushContextSpan(span) {
    var _a;
    this.context.contextSpanStack.push(span);
    (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Pushed scoped span [${span.start}-${span.end}]`);
  }
  popContextSpan() {
    var _a;
    const span = this.context.contextSpanStack.pop();
    if (span) {
      (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Popped scoped span [${span.start}-${span.end}]`);
    }
    return span;
  }
  clearContextSpans() {
    var _a;
    const count = this.context.contextSpanStack.length;
    this.context.contextSpanStack = [];
    (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Cleared ${count} context spans`);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────── DECLARATION TRACKING ──────────────────────┐
  startDeclaration(symbolName, symbolId, symbolKind, span, parentScope) {
    var _a;
    const declaration = {
      symbolName,
      symbolId,
      symbolKind,
      phase: "InDeclaration",
      span,
      parentScope
    };
    this.context.declarationStack.push(declaration);
    this.context.processingSymbols.add(symbolId);
    this.pushContextSpan(span);
    (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Started declaration of ${symbolKind} '${symbolName}' (id: ${symbolId})`);
  }
  startInitialization(symbolId) {
    var _a;
    const current = this.getCurrentDeclaration();
    if (current && current.symbolId === symbolId) {
      current.phase = "InInitialization";
      (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Started initialization of symbol '${current.symbolName}' (id: ${symbolId})`);
    }
  }
  completeDeclaration(symbolId) {
    var _a;
    const index = this.context.declarationStack.findIndex((d) => d.symbolId === symbolId);
    if (index >= 0) {
      const declaration = this.context.declarationStack[index];
      declaration.phase = "PostDeclaration";
      this.context.declarationStack.splice(index, 1);
      this.popContextSpan();
      (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Completed declaration of '${declaration.symbolName}' (id: ${symbolId})`);
    }
    this.context.processingSymbols.delete(symbolId);
    this.context.resolvedSymbols.add(symbolId);
  }
  isInDeclaration(symbolName) {
    return this.context.declarationStack.some((d) => d.symbolName === symbolName);
  }
  isInInitialization(symbolName) {
    return this.context.declarationStack.some(
      (d) => d.symbolName === symbolName && d.phase === "InInitialization"
      /* InInitialization */
    );
  }
  getCurrentDeclaration() {
    return this.context.declarationStack[this.context.declarationStack.length - 1];
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────── EXPRESSION TRACKING ──────────────────────┐
  enterExpression(type, span, relatedSymbol) {
    var _a, _b;
    if (!span) {
      (_a = this.debugManager) == null ? void 0 : _a.log("verbose", "Warning: Attempted to enter expression context without span");
      return;
    }
    const depth = this.context.expressionStack.length;
    this.context.expressionStack.push({ type, relatedSymbol, depth, span });
    this.pushContextSpan(span);
    (_b = this.debugManager) == null ? void 0 : _b.log("verbose", `Context: Entered expression ${type} at depth ${depth}`);
  }
  exitExpression() {
    var _a;
    if (this.context.expressionStack.length === 0) {
      return void 0;
    }
    const exited = this.context.expressionStack.pop();
    this.popContextSpan();
    if (exited) {
      (_a = this.debugManager) == null ? void 0 : _a.log("verbose", `Context: Exited expression ${exited.type} from depth ${exited.depth}`);
    }
    return exited;
  }
  getCurrentExpressionContext() {
    return this.context.expressionStack[this.context.expressionStack.length - 1];
  }
  isInExpressionType(type) {
    return this.context.expressionStack.some((ctx) => ctx.type === type);
  }
  getExpressionDepth() {
    return this.context.expressionStack.length;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────── SELF-REFERENCE DETECTION ────────────────────┐
  checkSelfReference(symbolName, referenceSpan) {
    const currentDeclaration = this.context.declarationStack.find(
      (d) => d.symbolName === symbolName && d.phase === "InInitialization"
      /* InInitialization */
    );
    if (currentDeclaration) {
      const errorType = currentDeclaration.symbolKind === "let" ? "VARIABLE_SELF_INIT" : "PARAMETER_SELF_INIT";
      return {
        isSelfReference: true,
        declarationContext: currentDeclaration,
        errorType
      };
    }
    return { isSelfReference: false };
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────── FORWARD REFERENCE TRACKING ───────────────────┐
  recordPendingReference(symbolName, span) {
    if (!this.context.pendingReferences.has(symbolName)) {
      this.context.pendingReferences.set(symbolName, []);
    }
    this.context.pendingReferences.get(symbolName).push(span);
  }
  resolvePendingReferences(symbolName) {
    const spans = this.context.pendingReferences.get(symbolName) || [];
    this.context.pendingReferences.delete(symbolName);
    return spans;
  }
  getPendingReferences() {
    return new Map(this.context.pendingReferences);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────── PARAMETER ORDER VALIDATION ───────────────────┐
  checkParameterForwardReference(parameterName, currentParameterIndex, allParameters) {
    const referencedParam = allParameters.find((p) => p.name === parameterName);
    if (referencedParam && referencedParam.index > currentParameterIndex) {
      return {
        isForwardReference: true,
        referencedParameterIndex: referencedParam.index
      };
    }
    return { isForwardReference: false };
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── CONTEXT QUERIES ────────────────────────┐
  getContextSpan() {
    if (this.context.contextSpanStack.length > 0) {
      return this.context.contextSpanStack[this.context.contextSpanStack.length - 1];
    }
    const currentExpression = this.getCurrentExpressionContext();
    if (currentExpression == null ? void 0 : currentExpression.span) {
      return currentExpression.span;
    }
    const currentDeclaration = this.getCurrentDeclaration();
    if (currentDeclaration == null ? void 0 : currentDeclaration.span) {
      return currentDeclaration.span;
    }
    return void 0;
  }
  getContext() {
    return this.context;
  }
  getPhase() {
    return this.context.currentPhase;
  }
  getModuleName() {
    return this.context.currentModuleName;
  }
  getModulePath() {
    return this.context.currentModulePath;
  }
  getScope() {
    return this.context.currentScope;
  }
  getProcessingSymbols() {
    return new Set(this.context.processingSymbols);
  }
  getResolvedSymbols() {
    return new Set(this.context.resolvedSymbols);
  }
  getDeclarationStack() {
    return [...this.context.declarationStack];
  }
  getCurrentDeclarationContext() {
    return this.context.declarationStack[this.context.declarationStack.length - 1];
  }
  getCurrentDeclarationSymbolId() {
    const current = this.getCurrentDeclaration();
    return current ? current.symbolId : void 0;
  }
  getCurrentDeclarationSymbolName() {
    const current = this.getCurrentDeclaration();
    return current ? current.symbolName : void 0;
  }
  getCurrentDeclarationSymbolKind() {
    const current = this.getCurrentDeclaration();
    return current ? current.symbolKind : void 0;
  }
  getCurrentDeclarationPhase() {
    const current = this.getCurrentDeclaration();
    return current ? current.phase : void 0;
  }
  getCurrentDeclarationSpan() {
    const current = this.getCurrentDeclaration();
    return current ? current.span : void 0;
  }
  getCurrentDeclarationParentScope() {
    const current = this.getCurrentDeclaration();
    return current ? current.parentScope : void 0;
  }
  getCurrentDeclarationStackDepth() {
    return this.context.declarationStack.length;
  }
  getCurrentDeclarationStackTrace() {
    return this.context.declarationStack.map(
      (d) => `${d.symbolKind} '${d.symbolName}' (${d.phase})`
    );
  }
  isProcessingSymbol(symbolId) {
    return this.context.processingSymbols.has(symbolId);
  }
  isSymbolResolved(symbolId) {
    return this.context.resolvedSymbols.has(symbolId);
  }
  getDeclarationStackTrace() {
    return this.context.declarationStack.map(
      (d) => `${d.symbolKind} '${d.symbolName}' (${d.phase})`
    );
  }
  getExpressionStackTrace() {
    return this.context.expressionStack.map(
      (e) => `${e.type} at depth ${e.depth}`
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── DEBUG UTILITIES ────────────────────────┐
  debugState() {
    console.log("Enhanced Context Tracker State:", {
      module: this.context.currentModuleName,
      phase: this.context.currentPhase,
      scope: this.context.currentScope,
      contextSpanStack: this.context.contextSpanStack.map((s) => `[${s.start}-${s.end}]`),
      declarationStack: this.getDeclarationStackTrace(),
      expressionStack: this.getExpressionStackTrace(),
      processingSymbols: Array.from(this.context.processingSymbols),
      pendingReferences: Array.from(this.context.pendingReferences.keys())
    });
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var DebugManager = class {
  constructor(contextTracker, debugLevel = "off") {
    this.debugLevel = "off";
    this.indentLevel = 0;
    this.debugLevel = debugLevel;
    this.contextTracker = contextTracker;
  }
  reset() {
    this.indentLevel = 0;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  log(level, message) {
    if (this.debugLevel === "off") {
      return;
    }
    const levels = ["off", "errors", "symbols", "scopes", "nodes", "verbose"];
    const currentIndex = levels.indexOf(this.debugLevel);
    const messageIndex = levels.indexOf(level);
    if (messageIndex <= currentIndex) {
      const prefix = this.getDebugPrefix(level);
      const indent = "  ".repeat(this.indentLevel);
      let callerName = "";
      try {
        const err = new Error();
        if (err.stack) {
          const stackLines = err.stack.split("\n");
          if (stackLines.length > 2) {
            const match = stackLines[2].match(/at (?:.*\.)?([a-zA-Z0-9_$]+)(?: \[as .*\])? /);
            if (match && match[1]) {
              callerName = match[1];
            }
          }
        }
      } catch (e) {
      }
      const callerInfo = callerName ? `${callerName}() : ` : "";
      let short_file_path = "unknown";
      let line = 0;
      let column = 0;
      try {
        const err = new Error();
        if (err.stack) {
          const stackLines = err.stack.split("\n");
          if (stackLines.length > 2) {
            const match = stackLines[2].match(/at .* \((.*):(\d+):(\d+)\)/) || stackLines[2].match(/at (.*):(\d+):(\d+)/);
            if (match && match[1] && match[2] && match[3]) {
              const fullPath = match[1];
              short_file_path = fullPath.split("/").slice(-2).join("/");
              line = parseInt(match[2], 10);
              column = parseInt(match[3], 10);
            }
          }
        }
      } catch (e) {
      }
      if (short_file_path !== "unknown") {
        const match = short_file_path.match(/(src|lib)[/\\].*/);
        if (match) {
          short_file_path = `./${match[0].replace(/\\/g, "/")}`;
        } else {
          const parts = short_file_path.split(/[/\\]/);
          if (parts.length > 2) {
            short_file_path = `./${parts.slice(-2).join("/")}`;
          } else if (parts.length === 2) {
            short_file_path = `./${short_file_path.replace(/\\/g, "/")}`;
          }
        }
      }
      console.log(`${prefix} ${indent}${callerInfo}${message} at ${short_file_path}:${line}:${column}`);
    }
  }
  increaseIndent() {
    this.indentLevel++;
  }
  decreaseIndent() {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
  setDebugLevel(level) {
    this.debugLevel = level;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ──────────────────────────────┐
  getDebugPrefix(level) {
    const prefixes = {
      errors: "\u{1F525}",
      symbols: "",
      // 📝
      scopes: "\u{1F4E6}",
      nodes: "\u{1F333}",
      verbose: ""
      // 📊
    };
    const prefix = prefixes[level] === "" ? "" : `[${prefixes[level] || "\u26A1"}]`;
    let phasePrefix = "";
    if (this.contextTracker) {
      const phase = this.contextTracker.getCurrentPhase();
      if (phase) {
        phasePrefix = `[${phase}] `;
      }
    }
    return `${phasePrefix}${prefix}`;
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var IdGenerator = class {
  constructor() {
    this.counter = 0;
  }
  next() {
    return ++this.counter;
  }
  reset() {
    this.counter = 0;
  }
  current() {
    return this.counter;
  }
};
var ScopeManager = class {
  constructor(diagnosticManager, debugManager) {
    this.diagnosticManager = diagnosticManager;
    this.debugManager = debugManager;
    this.idGenerator = new IdGenerator();
    this.symbolIdGenerator = new IdGenerator();
    this.init();
  }
  init() {
    this.scopes = /* @__PURE__ */ new Map();
    this.symbolTable = /* @__PURE__ */ new Map();
    this.namespaceLookup = /* @__PURE__ */ new Map();
    this.globalScope = this.createScope("Global", "global", null);
    this.currentScope = this.globalScope.id;
    this.initializeBuiltins();
  }
  reset() {
    const globalScopeId = this.globalScope.id;
    this.scopes.clear();
    this.symbolTable.clear();
    this.namespaceLookup.clear();
    this.scopes.set(globalScopeId, this.globalScope);
    this.currentScope = globalScopeId;
    this.globalScope.symbols.clear();
    this.globalScope.children = [];
    this.initializeBuiltins();
  }
  // Scope Management Methods
  createScope(kind, name, parentId) {
    const scope = {
      id: this.idGenerator.next(),
      kind,
      name,
      parent: parentId,
      children: [],
      symbols: /* @__PURE__ */ new Map(),
      level: parentId ? this.getScope(parentId).level + 1 : 0
    };
    this.scopes.set(scope.id, scope);
    if (parentId) {
      const parent = this.getScope(parentId);
      parent.children.push(scope.id);
    }
    return scope;
  }
  /**
   * Execute a function with proper scope cleanup guarantee.
   * Uses try-finally to ensure scope is ALWAYS restored, even on errors.
   */
  withScope(scopeId, fn) {
    var _a, _b;
    const previousScope = this.currentScope;
    if (!this.scopes.has(scopeId)) {
      throw new Error(`Cannot switch to non-existent scope ${scopeId}`);
    }
    (_a = this.debugManager) == null ? void 0 : _a.log(
      "verbose",
      `\u2192 Entering scope ${scopeId} (${this.getScope(scopeId).name}) from ${previousScope}`
    );
    this.setCurrentScope(scopeId);
    try {
      return fn();
    } finally {
      (_b = this.debugManager) == null ? void 0 : _b.log(
        "verbose",
        `\u2190 Restoring scope ${previousScope} from ${scopeId}`
      );
      this.setCurrentScope(previousScope);
    }
  }
  findScopeByName(name, kind) {
    for (const scope of this.scopes.values()) {
      if (scope.name === name && (kind ? scope.kind === kind : true)) {
        return scope;
      }
    }
    return null;
  }
  getSymbolInCurrentScope(name) {
    const currentScope = this.getScope(this.currentScope);
    return currentScope.symbols.get(name) || null;
  }
  findChildScopeByName(name, kind) {
    const currentScope = this.getScope(this.currentScope);
    for (const childId of currentScope.children) {
      const childScope = this.getScope(childId);
      if (childScope.name === name && (kind ? childScope.kind === kind : true)) {
        return childScope;
      }
    }
    return null;
  }
  findChildScopeByNameFromId(name, scopeId, kind) {
    const scope = this.getScope(scopeId);
    for (const childId of scope.children) {
      const childScope = this.getScope(childId);
      if (childScope.name === name && (kind ? childScope.kind === kind : true)) {
        return childScope;
      }
    }
    return null;
  }
  getScopeParent(scopeId) {
    const scope = this.getScope(scopeId);
    return scope.parent !== null ? this.getScope(scope.parent) : null;
  }
  enterScopeById(scopeId) {
    this.currentScope = scopeId;
  }
  getCurrentScopeId() {
    return this.currentScope;
  }
  setCurrentScope(scopeId) {
    if (!this.scopes.has(scopeId)) {
      throw new Error(`Scope ${scopeId} does not exist`);
    }
    this.currentScope = scopeId;
  }
  enterScope(kind, name) {
    const scope = this.createScope(kind, name, this.currentScope);
    this.currentScope = scope.id;
    return scope.id;
  }
  exitScope() {
    const current = this.getScope(this.currentScope);
    if (current.parent !== null) {
      const parentId = current.parent;
      this.currentScope = parentId;
      return parentId;
    }
    return null;
  }
  removeScope(scopeId) {
    this.scopes.delete(scopeId);
  }
  // Symbol Management Methods
  defineSymbol(name, kind, opts) {
    const symbol = {
      id: this.symbolIdGenerator.next(),
      name,
      kind,
      type: opts.type || null,
      scope: this.currentScope,
      contextSpan: opts.span || { start: 0, end: 0 },
      declared: true,
      initialized: false,
      used: false,
      isTypeChecked: false,
      visibility: opts.visibility || { kind: "Private" },
      mutability: opts.mutability || { kind: "Immutable" },
      namespace: opts.namespace,
      metadata: opts.metadata,
      typeInfo: opts.typeInfo,
      isExported: false
    };
    const scope = this.getScope(this.currentScope);
    scope.symbols.set(name, symbol);
    this.symbolTable.set(symbol.id, symbol);
    if (opts.namespace) {
      const nsSymbols = this.namespaceLookup.get(opts.namespace) || /* @__PURE__ */ new Set();
      nsSymbols.add(symbol.id);
      this.namespaceLookup.set(opts.namespace, nsSymbols);
    }
    return symbol.id;
  }
  resolveSymbol(name, opts = {}) {
    var _a;
    if (opts.namespace) {
      const nsSymbols = this.namespaceLookup.get(opts.namespace);
      if (nsSymbols) {
        for (const symbolId of nsSymbols) {
          const symbol = this.symbolTable.get(symbolId);
          if (symbol && symbol.name === name) {
            return symbol;
          }
        }
      }
    }
    let scope = this.getScope(this.currentScope);
    do {
      const symbol = scope.symbols.get(name);
      if (symbol) {
        return symbol;
      }
      if (opts.currentScopeOnly) {
        break;
      }
      scope = scope.parent !== null ? this.getScope(scope.parent) : null;
    } while (scope && ((_a = opts.includeParents) != null ? _a : true));
    return null;
  }
  initializeBuiltins() {
    this.createBuiltinSymbol("func", "@print", {
      type: TypeNode.asFunction({ start: 0, end: 0 }, [
        TypeNode.asU8Array({ start: 0, end: 0 })
      ], TypeNode.asVoid({ start: 0, end: 0 }))
    });
    this.createBuiltinSymbol("type", "str", {
      type: TypeNode.asU8Array({ start: 0, end: 0 })
    });
    this.createBuiltinSymbol("type", "char", {
      type: TypeNode.asUnsigned({ start: 0, end: 0 }, "u8", 8)
    });
  }
  createBuiltinSymbol(kind, name, options = { type: null }) {
    if (kind == "func") {
      const symbol = {
        id: this.symbolIdGenerator.next(),
        kind: "Function",
        name,
        contextSpan: { start: 0, end: 0 },
        scope: this.globalScope.id,
        visibility: { kind: "Public" },
        mutability: { kind: "Immutable" },
        type: options.type,
        used: false,
        initialized: true,
        declared: true,
        isTypeChecked: true,
        isExported: false,
        metadata: {
          callable: true,
          isBuiltin: true
        }
      };
      this.globalScope.symbols.set(name, symbol);
      this.symbolTable.set(symbol.id, symbol);
      return symbol;
    } else if (kind == "type") {
      const symbol = {
        id: this.symbolIdGenerator.next(),
        kind: "Definition",
        name: "str",
        contextSpan: { start: 0, end: 0 },
        scope: this.globalScope.id,
        visibility: { kind: "Public" },
        mutability: { kind: "Immutable" },
        type: options.type,
        used: false,
        initialized: true,
        declared: true,
        isTypeChecked: true,
        isExported: false,
        metadata: {
          isBuiltin: true
        }
      };
      this.globalScope.symbols.set("str", symbol);
      this.symbolTable.set(symbol.id, symbol);
      return symbol;
    }
    throw new Error("Unreachable");
  }
  // Utility Methods
  getScope(id) {
    const scope = this.scopes.get(id);
    if (!scope) {
      throw new Error(`Scope ${id} not found`);
    }
    return scope;
  }
  getAllSymbols() {
    return Array.from(this.symbolTable.values());
  }
  getSymbol(id) {
    const symbol = this.symbolTable.get(id);
    if (!symbol) {
      throw new Error(`Symbol ${id} not found`);
    }
    return symbol;
  }
  getCurrentScope() {
    return this.getScope(this.currentScope);
  }
  getGlobalScope() {
    return this.globalScope;
  }
  getAllScopes() {
    return Array.from(this.scopes.values());
  }
  // Enhanced Symbol Operations
  markSymbolUsed(symbolId) {
    const symbol = this.getSymbol(symbolId);
    symbol.used = true;
  }
  markSymbolInitialized(symbolId) {
    const symbol = this.getSymbol(symbolId);
    symbol.initialized = true;
  }
  markSymbolTypeChecked(symbolId) {
    const symbol = this.getSymbol(symbolId);
    symbol.isTypeChecked = true;
  }
  setSymbolType(symbolId, type) {
    const symbol = this.getSymbol(symbolId);
    symbol.type = type;
  }
  // Namespace Operations
  getNamespaceSymbols(namespace) {
    const nsSymbols = this.namespaceLookup.get(namespace);
    if (!nsSymbols) {
      return [];
    }
    return Array.from(nsSymbols).map((id) => this.getSymbol(id));
  }
  getAllSymbolsInScope(scopeId) {
    const scope = this.getScope(scopeId);
    return Array.from(scope.symbols.values());
  }
  getAllNamespaces() {
    return Array.from(this.namespaceLookup.keys());
  }
  // More
  addSymbolToScope(symbol, scopeId) {
    const scope = this.getScope(scopeId);
    scope.symbols.set(symbol.name, symbol);
    this.symbolTable.set(symbol.id, symbol);
  }
  /**
   * Look up a symbol in the current scope chain.
   * Prioritizes symbols from the current module before checking imported symbols.
   */
  lookupSymbol(name) {
    return this.lookupSymbolInScopeChain(name, this.currentScope);
  }
  /**
   * Walk up scope chain with module boundary awareness.
   * This prevents symbols from other modules from shadowing local definitions.
   */
  lookupSymbolInScopeChain(name, scopeId) {
    var _a;
    let scope = this.getScope(scopeId);
    let currentModuleScope = null;
    let checkScope = scope;
    while (checkScope) {
      if (checkScope.kind === "Module") {
        currentModuleScope = checkScope;
        break;
      }
      checkScope = checkScope.parent !== null ? this.getScope(checkScope.parent) : null;
    }
    if (currentModuleScope) {
      checkScope = scope;
      while (checkScope && checkScope.id !== currentModuleScope.id) {
        const symbol = checkScope.symbols.get(name);
        if (symbol) {
          return symbol;
        }
        checkScope = checkScope.parent !== null ? this.getScope(checkScope.parent) : null;
      }
      const moduleSymbol = currentModuleScope.symbols.get(name);
      if (moduleSymbol) {
        return moduleSymbol;
      }
      for (const childId of currentModuleScope.children) {
        const childScope = this.getScope(childId);
        if (childScope.kind === "Type" && childScope.name === name) {
          return currentModuleScope.symbols.get(name) || null;
        }
      }
    }
    const globalScope = this.scopes.get(1);
    if (globalScope) {
      const globalSymbol = globalScope.symbols.get(name);
      if (globalSymbol) {
        if (globalSymbol.kind === "Use" || ((_a = globalSymbol.metadata) == null ? void 0 : _a.isBuiltin)) {
          return globalSymbol;
        }
      }
    }
    return null;
  }
  /**
   * Find which module scope a symbol belongs to.
   */
  findModuleScopeForSymbol(symbol) {
    let scope = this.getScope(symbol.scope);
    while (scope) {
      if (scope.kind === "Module") {
        return scope;
      }
      scope = scope.parent !== null ? this.getScope(scope.parent) : null;
    }
    return null;
  }
  lookupSymbolInParentScopes(name, startingScopeId) {
    let scope = this.getScope(startingScopeId);
    while (scope) {
      const symbol = scope.symbols.get(name);
      if (symbol) {
        return symbol;
      }
      scope = scope.parent !== null ? this.getScope(scope.parent) : null;
    }
    return null;
  }
  /**
   * Alternative: If spans are not reliable, search by analyzing symbol positions
   */
  findScopeBySymbolPosition(position) {
    let bestMatch = null;
    for (const scope of this.scopes.values()) {
      for (const symbol of scope.symbols.values()) {
        const symbolSpan = symbol.targetSpan || symbol.contextSpan;
        if (position.start >= symbolSpan.start && position.end <= symbolSpan.end) {
          const distance = scope.level;
          if (!bestMatch || distance > bestMatch.distance) {
            bestMatch = { scope, distance };
          }
        }
      }
    }
    return (bestMatch == null ? void 0 : bestMatch.scope) || null;
  }
  // Complete ScopeManager LSP Lookup Methods
  // Add these methods to your ScopeManager class
  /**
   * Look up a symbol from LSP position information.
   * This finds the narrowest scope at the given span and searches for the symbol.
   * 
   * @param word - The identifier to search for
   * @param position_span - The span where the hover/completion was requested
   * @param moduleName - Optional: The name of the module to restrict search to
   * @returns The symbol if found, null otherwise
   */
  lookupSymbolFromLSP(word, position_span, moduleName) {
    console.log(`[ScopeManager] LSP lookup for "${word}" at span ${JSON.stringify(position_span)}${moduleName ? ` in module "${moduleName}"` : ""}`);
    let searchScope = null;
    if (moduleName) {
      for (const scope of this.scopes.values()) {
        if (scope.kind === "Module" && scope.name === moduleName) {
          searchScope = scope;
          console.log(`[ScopeManager] Restricted search to module: ${moduleName} (id: ${scope.id})`);
          break;
        }
      }
      if (!searchScope) {
        console.warn(`[ScopeManager] Module "${moduleName}" not found`);
        return null;
      }
      const importSymbol = this.findImportAtPosition(position_span, searchScope);
      if (importSymbol) {
        console.log(`[ScopeManager] Position is within import statement`);
        console.log(`[ScopeManager] Import symbol name: ${importSymbol.name}, alias: ${importSymbol.importAlias || "none"}`);
        console.log(`[ScopeManager] Looking for word: "${word}"`);
        console.log(`[ScopeManager] Resolving import to source symbol`);
        return this.resolveSymbolThroughImports(importSymbol);
      }
      const narrowestScope = this.findNarrowestScopeAtPosition(position_span, searchScope.id);
      searchScope = narrowestScope || searchScope;
    } else {
      searchScope = this.findNarrowestScopeAtPosition(position_span);
    }
    if (!searchScope) {
      console.log(`[ScopeManager] No scope found at position`);
      return null;
    }
    console.log(`[ScopeManager] Found search scope: ${searchScope.name} (kind: ${searchScope.kind}, id: ${searchScope.id})`);
    const symbol = this.lookupSymbolInScopeChain(word, searchScope.id);
    if (!symbol) {
      console.log(`[ScopeManager] Symbol "${word}" not found in scope chain`);
      return null;
    }
    console.log(`[ScopeManager] Found symbol: ${symbol.name} (kind: ${symbol.kind})`);
    if (symbol.kind === "Use") {
      const isOnImportStatement = this.isPositionOnSymbolDefinition(position_span, symbol);
      if (isOnImportStatement) {
        console.log(`[ScopeManager] Position is ON import statement, returning Use symbol`);
        return symbol;
      } else {
        console.log(`[ScopeManager] Position is on USAGE of imported symbol, resolving to source`);
        return this.resolveSymbolThroughImports(symbol);
      }
    }
    return symbol;
  }
  /**
   * Find if the position is within an import statement.
   * Returns the Use symbol if position is within any import's contextSpan.
   */
  findImportAtPosition(position, scope) {
    for (const symbol of scope.symbols.values()) {
      if (symbol.kind === "Use") {
        const contextSpan = symbol.contextSpan;
        if (position.start >= contextSpan.start && position.start <= contextSpan.end) {
          console.log(`[ScopeManager] Found position within import: ${symbol.name} (alias: ${symbol.importAlias || "none"}, context: ${contextSpan.start}-${contextSpan.end})`);
          return symbol;
        }
      }
    }
    return null;
  }
  /**
   * Check if the word matches this import symbol (either the imported name or alias).
   * For "use x as y", matches both "x" (original) and "y" (alias).
   */
  doesWordMatchImport(word, importSymbol) {
    var _a;
    if (importSymbol.name === word) {
      return true;
    }
    if (importSymbol.importAlias) {
      const originalName = (_a = importSymbol.metadata) == null ? void 0 : _a.originalImportName;
      if (originalName && originalName === word) {
        return true;
      }
    }
    return false;
  }
  /**
   * Check if the position is on the symbol's definition/declaration.
   * Returns true if hovering on where the symbol is defined, false if hovering on usage.
   */
  isPositionOnSymbolDefinition(position, symbol) {
    if (symbol.kind === "Use") {
      const contextSpan = symbol.contextSpan;
      const targetSpan2 = symbol.targetSpan;
      const isInContext = position.start >= contextSpan.start && position.start <= contextSpan.end;
      console.log(`[ScopeManager] Checking Use symbol ${symbol.name}:`);
      console.log(`  - position: ${position.start}-${position.end}`);
      console.log(`  - contextSpan: ${contextSpan.start}-${contextSpan.end}`);
      console.log(`  - targetSpan: ${targetSpan2 == null ? void 0 : targetSpan2.start}-${targetSpan2 == null ? void 0 : targetSpan2.end}`);
      console.log(`  - isInContext: ${isInContext}`);
      return isInContext;
    }
    const targetSpan = symbol.targetSpan || symbol.contextSpan;
    const isOnTarget = position.start >= targetSpan.start && position.start <= targetSpan.end;
    console.log(`[ScopeManager] Checking if position ${position.start}-${position.end} is on definition of ${symbol.name} (target: ${targetSpan.start}-${targetSpan.end}): ${isOnTarget}`);
    return isOnTarget;
  }
  /**
   * Resolve a symbol through imports to get the actual underlying symbol.
   * If the symbol is a Use (import), this follows the chain to find the real definition.
   */
  resolveSymbolThroughImports(symbol) {
    var _a;
    if (symbol.kind !== "Use") {
      return symbol;
    }
    console.log(`[ScopeManager] Resolving import symbol: ${symbol.name} (alias: ${symbol.importAlias || "none"})`);
    if (symbol.sourceSymbol) {
      const sourceSymbol = this.symbolTable.get(symbol.sourceSymbol);
      if (sourceSymbol) {
        console.log(`[ScopeManager] Resolved via sourceSymbol ID to: ${sourceSymbol.name} (${sourceSymbol.kind}) in module ${sourceSymbol.module}`);
        return sourceSymbol;
      }
    }
    if (symbol.importSource) {
      console.log(`[ScopeManager] Searching in module "${symbol.importSource}"`);
      for (const scope of this.scopes.values()) {
        if (scope.kind === "Module" && scope.name === symbol.importSource) {
          console.log(`[ScopeManager] Found source module scope: ${scope.name}`);
          const originalName = (_a = symbol.metadata) == null ? void 0 : _a.originalImportName;
          const searchName = originalName || symbol.name;
          console.log(`[ScopeManager] Looking for symbol "${searchName}" in source module`);
          const sourceSymbol = scope.symbols.get(searchName);
          if (sourceSymbol && sourceSymbol.kind !== "Use") {
            console.log(`[ScopeManager] Found source symbol: ${sourceSymbol.name} (${sourceSymbol.kind})`);
            return sourceSymbol;
          }
          console.log(`[ScopeManager] Symbol not found directly, checking all exported symbols`);
          for (const [name, sym] of scope.symbols.entries()) {
            if (sym.isExported && sym.kind !== "Use") {
              console.log(`[ScopeManager]   - Found exported: ${name} (${sym.kind})`);
              if (originalName === name || !originalName && name === symbol.name) {
                return sym;
              }
            }
          }
          break;
        }
      }
    }
    console.log(`[ScopeManager] Could not resolve import, returning import symbol`);
    return symbol;
  }
  /**
   * Find the narrowest (most specific) scope that contains the given position.
   * This walks the scope tree depth-first to find the deepest scope containing the position.
   * 
   * @param position - The position to search for
   * @param rootScopeId - Optional: Start search from this scope instead of global
   */
  findNarrowestScopeAtPosition(position, rootScopeId) {
    let narrowestScope = null;
    let maxDepth = -1;
    const spanContainsPosition = (scopeSpan, pos) => {
      if (!scopeSpan) return false;
      return pos.start >= scopeSpan.start && pos.end <= scopeSpan.end;
    };
    const scopeContainsSymbolsNearPosition = (scope, pos) => {
      for (const symbol of scope.symbols.values()) {
        const symbolSpan = symbol.targetSpan || symbol.contextSpan;
        if (Math.abs(symbolSpan.start - pos.start) < 1e3 || // Within 1000 chars
        spanContainsPosition(symbolSpan, pos)) {
          return true;
        }
      }
      return false;
    };
    const searchScope = (scopeId, depth) => {
      var _a;
      const scope = this.getScope(scopeId);
      const scopeSpan = (_a = scope.metadata) == null ? void 0 : _a.span;
      let containsPosition = false;
      if (scopeSpan) {
        containsPosition = spanContainsPosition(scopeSpan, position);
      } else if (scope.kind === "Module") {
        containsPosition = scopeContainsSymbolsNearPosition(scope, position);
      } else {
        for (const symbol of scope.symbols.values()) {
          if (spanContainsPosition(symbol.contextSpan, position) || symbol.targetSpan && spanContainsPosition(symbol.targetSpan, position)) {
            containsPosition = true;
            break;
          }
        }
      }
      if (containsPosition && depth > maxDepth) {
        narrowestScope = scope;
        maxDepth = depth;
      }
      for (const childId of scope.children) {
        searchScope(childId, depth + 1);
      }
    };
    const startScopeId = rootScopeId != null ? rootScopeId : this.globalScope.id;
    searchScope(startScopeId, 0);
    if (!narrowestScope) {
      console.log(`[ScopeManager] No scope found via tree search, searching by symbol proximity`);
      narrowestScope = this.findScopeBySymbolProximity(position, rootScopeId);
    }
    if (!narrowestScope) {
      console.log(`[ScopeManager] Using root scope as final fallback`);
      narrowestScope = rootScopeId ? this.getScope(rootScopeId) : this.globalScope;
    }
    return narrowestScope;
  }
  /**
   * Find scope by symbol proximity - looks for symbols closest to position.
   * This is used as a fallback when scope span information is not available.
   * 
   * @param position - The position to search near
   * @param rootScopeId - Optional: Restrict search to this scope and its children
   */
  findScopeBySymbolProximity(position, rootScopeId) {
    let bestMatch = null;
    console.log(`[ScopeManager] Searching by symbol proximity for position ${position.start}-${position.end}${rootScopeId ? ` within scope ${rootScopeId}` : ""}`);
    const isWithinRootScope = (scope) => {
      if (!rootScopeId) return true;
      let current = scope;
      while (current) {
        if (current.id === rootScopeId) return true;
        current = current.parent !== null ? this.getScope(current.parent) : null;
      }
      return false;
    };
    for (const scope of this.scopes.values()) {
      if (scope.kind === "Global") continue;
      if (rootScopeId && !isWithinRootScope(scope)) {
        continue;
      }
      if (scope.kind === "Module" || scope.kind === "Function") {
        for (const symbol of scope.symbols.values()) {
          const symbolSpan = symbol.contextSpan;
          if (position.start >= symbolSpan.start && position.start <= symbolSpan.end) {
            console.log(`[ScopeManager] Found scope by direct containment: ${scope.name} (symbol: ${symbol.name})`);
            return scope;
          }
          const distance = Math.abs(symbolSpan.start - position.start);
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { scope, distance, symbol };
          }
        }
      }
    }
    if (bestMatch) {
      console.log(`[ScopeManager] Found scope by proximity: ${bestMatch.scope.name} (closest symbol: ${bestMatch.symbol.name}, distance: ${bestMatch.distance})`);
      return bestMatch.scope;
    }
    return null;
  }
  /**
   * Public method to get symbol at a specific position (used by LSP).
   * This checks if the position directly points to a symbol definition.
   */
  getSymbolAtPosition(position) {
    for (const symbol of this.symbolTable.values()) {
      const targetSpan = symbol.targetSpan || symbol.contextSpan;
      if (position.start >= targetSpan.start && position.start <= targetSpan.end) {
        console.log(`[ScopeManager] Found symbol directly at position: ${symbol.name}`);
        return symbol;
      }
    }
    return null;
  }
};
var PathUtils = class {
  /**
   * Resolves a module import path against the program's root path
   */
  static resolveModulePath(program, importPath, currentModulePath) {
    var _a;
    const programRoot = ((_a = program.metadata) == null ? void 0 : _a.path) || "./";
    if (importPath.startsWith(".") && currentModulePath) {
      const currentDir = path.dirname(currentModulePath);
      const resolved = path.resolve(currentDir, importPath);
      return path.relative(programRoot, resolved);
    }
    if (path.isAbsolute(importPath)) {
      return path.relative(programRoot, importPath);
    }
    return path.normalize(importPath);
  }
  /**
   * Finds a module by its resolved path
   */
  static findModuleByPath(program, targetPath) {
    var _a, _b;
    const programRoot = ((_a = program.metadata) == null ? void 0 : _a.path) || "./";
    const normalizedTarget = path.normalize(targetPath);
    for (const [_, module] of program.modules) {
      const modulePath = (_b = module.metadata) == null ? void 0 : _b.path;
      if (!modulePath) continue;
      const relativeModulePath = path.relative(programRoot, modulePath);
      const normalizedModulePath = path.normalize(modulePath);
      const normalizedRelativePath = path.normalize(relativeModulePath);
      if (normalizedModulePath === normalizedTarget || normalizedRelativePath === normalizedTarget || modulePath === targetPath || relativeModulePath === targetPath) {
        return module;
      }
    }
    return void 0;
  }
  /**
   * Validates if a path exists in the program structure
   */
  static validatePath(program, importPath, currentModulePath) {
    try {
      const resolvedPath = this.resolveModulePath(program, importPath, currentModulePath);
      return this.findModuleByPath(program, resolvedPath) !== void 0;
    } catch (e) {
      return false;
    }
  }
  /**
   * Gets the relative path between two modules
   */
  static getRelativePath(fromPath, toPath) {
    const relativePath = path.relative(path.dirname(fromPath), toPath);
    return relativePath.startsWith(".") ? relativePath : "./" + relativePath;
  }
  /**
   * Finds the module name by its path
   */
  static findModuleNameByPath(program, targetPath) {
    var _a;
    const module = this.findModuleByPath(program, targetPath);
    if (!module) return void 0;
    const metadataName = (_a = module.metadata) == null ? void 0 : _a.name;
    if (metadataName) return metadataName;
    const baseName = path.basename(targetPath, path.extname(targetPath));
    return baseName === "index" ? path.basename(path.dirname(targetPath)) : baseName;
  }
  /**
   * Normalizes a path for consistent comparison
   */
  static normalizePath(filePath) {
    return path.normalize(filePath).replace(/\\/g, "/");
  }
};
var PhaseBase = class {
  constructor(phase, config) {
    this.phase = phase;
    this.config = config;
  }
  reportError(code, message, span) {
    this.config.services.diagnosticManager.reportError(code, message, span);
  }
  reportWarning(code, message, span) {
    this.config.services.diagnosticManager.reportWarning(code, message, span);
  }
  reportInfo(code, message, span) {
    this.config.services.diagnosticManager.reportInfo(code, message, span);
  }
  log(kind = "verbose", message) {
    this.config.services.debugManager.log(kind, message);
  }
};
var SymbolCollector = class extends PhaseBase {
  // moduleName -> exported symbol names
  constructor(config) {
    super("Collection", config);
    this.pathContext = { pathMappings: /* @__PURE__ */ new Map() };
    this.stats = this.initStats();
    this.typeContext = this.initTypeContext();
    this.typeRegistry = /* @__PURE__ */ new Map();
    this.moduleExports = /* @__PURE__ */ new Map();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  handle() {
    try {
      this.log("verbose", "Starting symbol collection phase...");
      this.stats.startTime = Date.now();
      if (!this.init()) {
        return false;
      }
      if (!this.buildPathMappings()) {
        return false;
      }
      if (!this.collectAllModules()) {
        return false;
      }
      this.logStatistics();
      return !this.config.services.diagnosticManager.hasErrors();
    } catch (error) {
      this.log("errors", `Fatal error during symbol collection: ${error}`);
      this.reportError("INTERNAL_ERROR", `Fatal error during symbol collection: ${error}`);
      return false;
    }
  }
  reset() {
    this.pathContext = { pathMappings: /* @__PURE__ */ new Map() };
    this.stats = this.initStats();
    this.typeContext = this.initTypeContext();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────── [1] Program Level ─────────────────────────┐
  buildPathMappings() {
    var _a, _b;
    this.log("verbose", "Building module path mappings...");
    this.pathContext.pathMappings.clear();
    const rootPath = (_a = this.config.program.metadata) == null ? void 0 : _a.path;
    if (!rootPath) {
      this.reportWarning("MODULE_NOT_FOUND", "No root path found in program metadata");
      return false;
    }
    this.pathContext.rootPath = rootPath;
    for (const [moduleName, module] of this.config.program.modules) {
      const modulePath = (_b = module.metadata) == null ? void 0 : _b.path;
      if (!modulePath) {
        this.reportWarning("MODULE_NOT_FOUND", `No file path found for module ${moduleName}`);
        continue;
      }
      try {
        const relativePath = PathUtils.getRelativePath(rootPath, modulePath);
        const normalizedPath = PathUtils.normalizePath(relativePath);
        if (this.pathContext.pathMappings.has(normalizedPath)) {
          const existing = this.pathContext.pathMappings.get(normalizedPath);
          if (existing !== moduleName) {
            this.reportError(
              "MODULE_NOT_FOUND",
              `Path collision: '${normalizedPath}' maps to both '${existing}' and '${moduleName}'`
            );
            return false;
          }
        }
        this.pathContext.pathMappings.set(modulePath, moduleName);
        this.pathContext.pathMappings.set(relativePath, moduleName);
        this.pathContext.pathMappings.set(normalizedPath, moduleName);
        this.log("verbose", `Mapped ${moduleName} -> ${relativePath}`);
      } catch (error) {
        this.reportWarning("MODULE_NOT_FOUND", `Failed to map module path for ${moduleName}: ${error}`);
      }
    }
    return true;
  }
  collectAllModules() {
    this.log("verbose", "Collecting symbols from all modules...");
    const globalScope = this.config.services.scopeManager.getCurrentScope();
    for (const [moduleName, module] of this.config.program.modules) {
      this.config.services.contextTracker.pushContextSpan({ start: 0, end: 0 });
      try {
        if (!this.collectModule(moduleName, module, globalScope)) {
          if (this.config.services.contextTracker.getCurrentPhase() === "Collection") {
            this.log("errors", `Failed to collect from module ${moduleName}, continuing...`);
          }
        }
        this.stats.modulesProcessed++;
      } finally {
        this.config.services.contextTracker.popContextSpan();
      }
    }
    return true;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────── [2] Module Level ──────────────────────────┐
  collectModule(moduleName, module, parentScope) {
    var _a;
    this.log("symbols", `Collecting from module '${moduleName}'`);
    this.typeContext = this.initTypeContext();
    try {
      this.config.services.contextTracker.setModuleName(moduleName);
      const modulePath = (_a = module.metadata) == null ? void 0 : _a.path;
      if (modulePath) {
        this.config.services.contextTracker.setModulePath(modulePath);
        this.pathContext.currentModulePath = modulePath;
      }
      const moduleScope = this.createModuleScope(moduleName, parentScope);
      for (const statement of module.statements) {
        if (statement.kind === "Def" || statement.kind === "Let" || statement.kind === "Func") {
          this.collectStmt(statement, moduleScope, moduleName);
        }
      }
      for (const statement of module.statements) {
        if (statement.kind === "Use") {
          this.collectStmt(statement, moduleScope, moduleName);
        }
      }
      for (const statement of module.statements) {
        if (statement.kind !== "Def" && statement.kind !== "Let" && statement.kind !== "Func" && statement.kind !== "Use") {
          this.collectStmt(statement, moduleScope, moduleName);
        }
      }
      return true;
    } catch (error) {
      this.reportError("MODULE_NOT_FOUND", `Failed to collect symbols from module '${moduleName}': ${error}`);
      return false;
    }
  }
  createModuleScope(moduleName, parentScope) {
    const moduleScope = this.config.services.scopeManager.createScope("Module", moduleName, parentScope.id);
    this.incrementScopesCreated();
    this.log("scopes", `Created module scope ${moduleScope.id} for '${moduleName}'`);
    return moduleScope;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [3] Stmt Level ───────────────────────────┐
  collectStmt(stmt, currentScope, moduleName) {
    if (!stmt) {
      this.reportError("ANALYSIS_ERROR", "Found null statement during collection");
      return;
    }
    this.log("verbose", `Collecting from ${stmt.kind} statement`);
    this.config.services.contextTracker.pushContextSpan(stmt.span);
    try {
      this.config.services.scopeManager.withScope(currentScope.id, () => {
        this.config.services.contextTracker.withSavedState(() => {
          this.config.services.contextTracker.setScope(currentScope.id);
          this.processStmt(stmt, currentScope, moduleName);
        });
      });
    } catch (error) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Failed to process ${stmt.kind} statement: ${error}`,
        stmt.span
      );
    } finally {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  processStmt(stmt, currentScope, moduleName) {
    const nodeGetter = this.getNodeGetter(stmt);
    if (!nodeGetter) {
      this.reportError("INTERNAL_ERROR", `Invalid AST: ${stmt.kind} node is null`);
      return;
    }
    switch (stmt.kind) {
      case "Block":
        this.handleBlockStatement(stmt.getBlock(), currentScope, moduleName);
        break;
      case "Test":
        this.handleTestStmt(stmt.getTest(), currentScope, moduleName);
        break;
      case "Use":
        this.handleUseStatement(stmt.getUse(), currentScope, moduleName);
        break;
      case "Def":
        this.handleDefStatement(stmt.getDef(), currentScope, moduleName);
        break;
      case "Let":
        this.handleLetStatement(stmt.getLet(), currentScope, moduleName);
        break;
      case "Func":
        this.handleFuncStatement(stmt.getFunc(), currentScope, moduleName);
        break;
      case "While":
      case "Do":
      case "For":
        this.handleLoopStmt(stmt, currentScope, moduleName);
        break;
      case "Return":
      case "Defer":
      case "Throw":
        this.handleControlflowStmt(stmt, currentScope, moduleName);
        break;
      case "Expression":
        this.collectExpr(stmt.getExpr(), currentScope, moduleName);
        break;
    }
  }
  getNodeGetter(stmt) {
    switch (stmt.kind) {
      case "Def":
        return () => stmt.getDef();
      case "Use":
        return () => stmt.getUse();
      case "Let":
        return () => stmt.getLet();
      case "Func":
        return () => stmt.getFunc();
      case "Block":
        return () => stmt.getBlock();
      case "Return":
        return () => stmt.getReturn();
      case "Defer":
        return () => stmt.getDefer();
      case "Throw":
        return () => stmt.getThrow();
      case "Expression":
        return () => stmt.getExpr();
      case "While":
      case "Do":
      case "For":
        return () => stmt.getLoop();
      case "Break":
        return () => stmt.getBreak();
      case "Continue":
        return () => stmt.getContinue();
      case "Test":
        return () => stmt.getTest();
      default:
        return null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────── [3.1] BLOCK ─────────────────────────────┐
  handleBlockStatement(blockNode, scope, moduleName) {
    this.collectBlockStmt(blockNode, scope, moduleName);
  }
  createBlockScope(parentScope) {
    const blockScope = this.config.services.scopeManager.createScope("Block", "block", parentScope.id);
    this.incrementScopesCreated();
    this.log("scopes", `Created block scope ${blockScope.id} under parent ${parentScope.id}`);
    return blockScope;
  }
  collectBlockStmt(blockNode, parentScope, moduleName) {
    const blockScope = this.createBlockScope(parentScope);
    this.config.services.scopeManager.withScope(blockScope.id, () => {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.contextTracker.setScope(blockScope.id);
        for (const stmt of blockNode.stmts) {
          this.collectStmt(stmt, blockScope, moduleName);
        }
      });
    });
  }
  handleTestStmt(testNode, scope, moduleName) {
    this.collectBlockStmt(testNode.block, scope, moduleName);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.2] USE ──────────────────────────────┐
  handleUseStatement(useNode, scope, moduleName) {
    this.collectUseStmt(useNode, scope, moduleName);
  }
  createUseSymbol(useNode, currentScope, moduleName, targetModuleName) {
    var _a;
    const symbolName = this.extractImportSymbolName(useNode);
    const targetSpan = useNode.alias ? useNode.alias.span : useNode.targetArr ? useNode.targetArr[useNode.targetArr.length - 1].span : useNode.span;
    const symbol = this.createBaseSymbol(
      symbolName,
      "Use",
      currentScope,
      moduleName,
      useNode.span,
      targetSpan
    );
    const isModuleScope = currentScope.kind === "Module";
    const isPublic = useNode.visibility.kind === "Public";
    const metadata = {};
    if (!useNode.targetArr) {
      metadata.isWildcardImport = true;
      metadata.exportedSymbols = targetModuleName ? Array.from(this.getModuleExports(targetModuleName) || []) : [];
    } else if (useNode.targetArr.length > 1) {
      metadata.memberPath = useNode.targetArr.map((t) => t.name);
      metadata.needsFullResolution = true;
    }
    return __spreadProps(__spreadValues2({}, symbol), {
      initialized: true,
      visibility: useNode.visibility,
      isExported: isModuleScope && isPublic,
      importSource: targetModuleName,
      importPath: targetModuleName ? useNode.path : void 0,
      importAlias: targetModuleName ? (_a = useNode.alias) == null ? void 0 : _a.name : void 0,
      metadata: Object.keys(metadata).length > 0 ? metadata : void 0,
      declared: false
      // ⚠️ Not declared until resolution validates it
    });
  }
  collectUseStmt(useNode, currentScope, moduleName) {
    this.log("symbols", "Collecting use statement");
    try {
      if (useNode.path) {
        this.processModuleImport(useNode, currentScope, moduleName);
      } else {
        this.processLocalUse(useNode, currentScope, moduleName);
      }
    } catch (error) {
      this.reportError("ANALYSIS_ERROR", `Failed to process use statement: ${error}`, useNode.span);
    }
  }
  extractImportSymbolName(useNode, allow_alias = true) {
    if (allow_alias && useNode.alias) {
      return useNode.alias.name;
    }
    if (!useNode.targetArr) {
      if (!useNode.alias) {
        this.reportError(
          "ANALYSIS_ERROR",
          `Wildcard import requires an alias (use * as <name> from "...")`,
          useNode.span
        );
        return "<invalid>";
      }
      return useNode.alias.name;
    }
    const isJustIdent = useNode.targetArr.length === 1;
    if (isJustIdent) {
      return useNode.targetArr[0].name;
    } else {
      return useNode.targetArr[useNode.targetArr.length - 1].name;
    }
  }
  processModuleImport(useNode, currentScope, moduleName) {
    var _a, _b, _c, _d, _e;
    if (!this.config.program || !useNode.path) {
      this.reportError("MODULE_NOT_FOUND", "Invalid import: missing path", useNode.span);
      return;
    }
    const currentModule = this.config.program.modules.get(moduleName);
    const currentModulePath = (_a = currentModule == null ? void 0 : currentModule.metadata) == null ? void 0 : _a.path;
    if (!PathUtils.validatePath(this.config.program, useNode.path, currentModulePath)) {
      this.reportError("MODULE_NOT_FOUND", `Module not found in path '${useNode.path}'`, useNode.pathSpan);
      this.stats.importResolutionFailures++;
      return;
    }
    const resolvedPath = PathUtils.resolveModulePath(this.config.program, useNode.path, currentModulePath);
    const targetModuleName = PathUtils.findModuleNameByPath(this.config.program, resolvedPath);
    if (!targetModuleName) {
      this.reportError("MODULE_NOT_FOUND", `Could not resolve module name for path: ${useNode.path}`, useNode.span);
      this.stats.importResolutionFailures++;
      return;
    }
    const targetModule = this.config.program.modules.get(targetModuleName);
    if (!targetModule) {
      this.reportError("MODULE_NOT_FOUND", `Target module '${targetModuleName}' not found`, useNode.span);
      this.stats.importResolutionFailures++;
      return;
    }
    if (!useNode.targetArr) {
      this.processWildcardImport(useNode, targetModule, targetModuleName, currentScope, moduleName);
      return;
    }
    if (!this.validateMemberPathInModule(targetModule, useNode.targetArr, useNode)) {
      this.reportError("SYMBOL_NOT_FOUND", `Symbol '${useNode.targetArr[0].name}' not found in module '${targetModuleName}'`, useNode.targetArr[0].span);
      this.stats.importResolutionFailures++;
      return;
    }
    const symbolName = this.extractImportSymbolName(useNode);
    const existingImport = currentScope.symbols.get(symbolName);
    if (existingImport && existingImport.kind === "Use" && existingImport.importSource === targetModuleName) {
      this.reportWarning(
        "DUPLICATE_SYMBOL",
        `Symbol '${symbolName}' already imported from module '${targetModuleName}'`,
        (_c = (_b = useNode.alias) == null ? void 0 : _b.span) != null ? _c : useNode.targetArr[useNode.targetArr.length - 1].span
      );
    }
    if (this.checkForShadowing(symbolName, currentScope, "Use", (_e = (_d = useNode.alias) == null ? void 0 : _d.span) != null ? _e : useNode.targetArr[useNode.targetArr.length - 1].span)) {
      return;
    }
    const rootSymbolName = useNode.targetArr[0].name;
    if (!this.canImportSymbol(targetModuleName, rootSymbolName)) {
      this.reportError(
        "SYMBOL_NOT_EXPORTED",
        `Symbol '${rootSymbolName}' is private in module '${targetModuleName}'`,
        useNode.targetArr[0].span
      );
      this.stats.importResolutionFailures++;
      return;
    }
    const useSymbol = this.createUseSymbol(useNode, currentScope, moduleName, targetModuleName);
    this.config.services.scopeManager.addSymbolToScope(useSymbol, currentScope.id);
    this.incrementSymbolsCollected();
    this.log("verbose", `Resolved import ${useNode.path} -> ${targetModuleName}.${useNode.targetArr.map((t) => t.name).join(".")}`);
  }
  processWildcardImport(useNode, targetModule, targetModuleName, currentScope, moduleName) {
    if (!useNode.alias) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Wildcard import requires an alias (use * as <name> from "...")`,
        useNode.span
      );
      return;
    }
    const aliasName = useNode.alias.name;
    if (this.checkForShadowing(aliasName, currentScope, "Use", useNode.alias.span)) {
      return;
    }
    const exports = this.getModuleExports(targetModuleName);
    if (!exports || exports.size === 0) {
      this.reportWarning(
        "ANALYSIS_ERROR",
        `Module '${targetModuleName}' has no exported symbols`,
        useNode.span
      );
    }
    const symbol = this.createBaseSymbol(
      aliasName,
      "Use",
      currentScope,
      moduleName,
      useNode.span,
      useNode.alias.span
    );
    const isModuleScope = currentScope.kind === "Module";
    const isPublic = useNode.visibility.kind === "Public";
    const wildcardSymbol = __spreadProps(__spreadValues2({}, symbol), {
      initialized: true,
      visibility: useNode.visibility,
      isExported: isModuleScope && isPublic,
      importSource: targetModuleName,
      importPath: useNode.path,
      importAlias: aliasName,
      metadata: {
        isWildcardImport: true,
        exportedSymbols: exports ? Array.from(exports) : []
      },
      declared: false
      // Will be resolved later
    });
    this.config.services.scopeManager.addSymbolToScope(wildcardSymbol, currentScope.id);
    this.incrementSymbolsCollected();
    this.log("verbose", `Collected wildcard import from '${targetModuleName}' as '${aliasName}'`);
  }
  processLocalUse(useNode, currentScope, moduleName) {
    var _a, _b;
    if (!useNode.targetArr) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Wildcard import not supported for local use. Use 'use * as x from "path"' for module imports`,
        useNode.span
      );
      return;
    }
    const symbolName = this.extractImportSymbolName(useNode);
    if (this.checkForShadowing(symbolName, currentScope, "Use", (_b = (_a = useNode.alias) == null ? void 0 : _a.span) != null ? _b : useNode.targetArr[0].span)) {
      return;
    }
    const useSymbol = this.createUseSymbol(useNode, currentScope, moduleName);
    this.config.services.scopeManager.addSymbolToScope(useSymbol, currentScope.id);
    this.incrementSymbolsCollected();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.3] DEF ──────────────────────────────┐
  handleDefStatement(defNode, scope, moduleName) {
    this.collectDefStmt(defNode, scope, moduleName);
  }
  createDefSymbol(defNode, scope, moduleName) {
    var _a;
    const symbol = this.createBaseSymbol(
      defNode.ident.name,
      "Definition",
      scope,
      moduleName,
      defNode.span,
      defNode.ident.span
    );
    const isModuleScope = scope.kind === "Module";
    const isPublic = defNode.visibility.kind === "Public";
    return __spreadProps(__spreadValues2({}, symbol), {
      type: (_a = defNode.type) != null ? _a : null,
      initialized: true,
      visibility: defNode.visibility,
      isExported: isModuleScope && isPublic
      // ✅ Set export flag
    });
  }
  collectDefStmt(defNode, scope, moduleName) {
    this.log("symbols", `Collecting definition '${defNode.ident.name}'`);
    if (this.checkForShadowing(defNode.ident.name, scope, "Definition", defNode.ident.span)) {
      return;
    }
    const symbol = this.createDefSymbol(defNode, scope, moduleName);
    this.config.services.scopeManager.addSymbolToScope(symbol, scope.id);
    this.incrementSymbolsCollected();
    this.trackModuleExport(moduleName, defNode.ident.name, symbol.isExported);
    this.typeRegistry.set(defNode.ident.name, symbol);
    this.collectType(defNode.type, scope, moduleName, defNode.ident.name);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.4] LET ──────────────────────────────┐
  handleLetStatement(letNode, scope, moduleName) {
    this.collectLetStmt(letNode, scope, moduleName);
  }
  createLetSymbol(varNode, scope, moduleName) {
    var _a;
    const symbol = this.createBaseSymbol(
      varNode.field.ident.name,
      "Variable",
      scope,
      moduleName,
      varNode.field.span,
      varNode.field.ident.span
    );
    const isModuleScope = scope.kind === "Module";
    const isPublic = varNode.field.visibility.kind === "Public";
    return __spreadProps(__spreadValues2({}, symbol), {
      type: (_a = varNode.field.type) != null ? _a : null,
      initialized: !!varNode.field.initializer,
      visibility: varNode.field.visibility,
      mutability: varNode.field.mutability,
      isExported: isModuleScope && isPublic,
      metadata: {
        initializer: varNode.field.initializer
        // ✅ ADD THIS
      }
    });
  }
  collectLetStmt(letNode, scope, moduleName) {
    this.log("symbols", `Collecting let '${letNode.field.ident.name}'`);
    if (this.checkForShadowing(letNode.field.ident.name, scope, "Variable", letNode.field.ident.span, false)) {
      return;
    }
    this.checkForShadowing(letNode.field.ident.name, scope, "Variable", letNode.field.ident.span, true);
    const symbol = this.createLetSymbol(letNode, scope, moduleName);
    this.config.services.scopeManager.addSymbolToScope(symbol, scope.id);
    this.incrementSymbolsCollected();
    this.trackModuleExport(moduleName, letNode.field.ident.name, symbol.isExported);
    if (letNode.field.initializer) {
      const initType = this.extractTypeFromInitializer(letNode.field.initializer);
      if (initType) {
        letNode.field.type = initType;
        symbol.type = initType;
        if (initType.isStruct() || initType.isEnum()) {
          this.collectType(initType, scope, moduleName, letNode.field.ident.name);
        }
      }
    }
    if (letNode.field.type) {
      this.collectType(letNode.field.type, scope, moduleName, letNode.field.ident.name);
    }
    if (letNode.field.initializer && !letNode.field.type) {
      this.collectExpr(letNode.field.initializer, scope, moduleName);
    }
  }
  extractTypeFromInitializer(expr) {
    if (expr.kind !== "Primary") return null;
    const primary = expr.getPrimary();
    if (!primary) return null;
    if (primary.kind === "Type") {
      return primary.getType();
    }
    if (primary.kind === "Object") {
      const obj = primary.getObject();
      if (!obj || !obj.ident) return null;
      const typeSymbol = this.config.services.scopeManager.lookupSymbol(obj.ident.name);
      if (!typeSymbol || !typeSymbol.type) return null;
      if (typeSymbol.type.isStruct()) {
        return typeSymbol.type;
      }
    }
    return null;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.5] FUNC ─────────────────────────────┐
  handleFuncStatement(funcNode, scope, moduleName) {
    this.collectFuncStmt(funcNode, scope, moduleName);
  }
  createFuncSymbol(funcNode, scope, moduleName) {
    const symbol = this.createBaseSymbol(
      funcNode.ident.name,
      "Function",
      scope,
      moduleName,
      funcNode.span,
      funcNode.ident.span
    );
    const isModuleScope = scope.kind === "Module";
    const isPublic = funcNode.visibility.kind === "Public";
    return __spreadProps(__spreadValues2({}, symbol), {
      initialized: true,
      visibility: funcNode.visibility,
      isExported: isModuleScope && isPublic,
      metadata: {
        callable: true,
        params: [],
        returnType: funcNode.returnType || void 0,
        errorType: funcNode.errorType || void 0
      }
    });
  }
  createFuncScope(functionName, parentScope) {
    const funcScope = this.config.services.scopeManager.createScope("Function", functionName, parentScope.id);
    this.incrementScopesCreated();
    return funcScope;
  }
  collectFuncStmt(funcNode, scope, moduleName) {
    var _a;
    this.log("symbols", `Collecting function '${funcNode.ident.name}'`);
    if (this.checkForShadowing(funcNode.ident.name, scope, "Function", funcNode.ident.span)) {
      return;
    }
    this.checkForShadowing(funcNode.ident.name, scope, "Function", funcNode.ident.span, true);
    const funcScope = this.createFuncScope(funcNode.ident.name, scope);
    const funcSymbol = this.createFuncSymbol(funcNode, scope, moduleName);
    this.config.services.scopeManager.addSymbolToScope(funcSymbol, scope.id);
    this.incrementSymbolsCollected();
    this.trackModuleExport(moduleName, funcNode.ident.name, funcSymbol.isExported);
    const parentScope = this.config.services.scopeManager.getScope(scope.id);
    const isStructMethod = parentScope.kind === "Type" && ((_a = parentScope.metadata) == null ? void 0 : _a.typeKind) === "Struct" && !(funcNode.visibility.kind === "Static");
    this.config.services.scopeManager.withScope(funcScope.id, () => {
      this.config.services.contextTracker.withSavedState(() => {
        if (isStructMethod) {
          this.injectSelfParameter(funcScope, parentScope, moduleName);
        }
        this.collectType(funcNode.returnType, scope, moduleName, funcNode.ident.name);
        if (funcSymbol.metadata && funcSymbol.metadata.params) {
          funcSymbol.metadata.params = this.collectParams(funcNode.parameters, funcScope, moduleName);
        }
        if (funcNode.body) {
          this.collectStmt(funcNode.body, funcScope, moduleName);
        }
      });
    });
  }
  // ───── PARAMS ─────
  createParamSymbol(paramNode, scope, moduleName) {
    var _a, _b;
    const symbol = this.createBaseSymbol(
      paramNode.ident.name,
      "Parameter",
      scope,
      moduleName,
      paramNode.span,
      paramNode.ident.span
    );
    return __spreadProps(__spreadValues2({}, symbol), {
      type: (_a = paramNode.type) != null ? _a : null,
      initialized: true,
      visibility: (_b = paramNode.visibility) != null ? _b : "Private",
      mutability: paramNode.mutability
      // ✅ Added
    });
  }
  collectParams(parameters, funcScope, moduleName) {
    const collectedParams = [];
    const seenParams = /* @__PURE__ */ new Set();
    const hasSelfParam = funcScope.symbols.has("self");
    for (const paramNode of parameters) {
      if (paramNode.ident.name === "self" && hasSelfParam) {
        this.reportError(
          "PARAMETER_SHADOWING",
          `Duplicate parameter name 'self'`,
          paramNode.ident.span
        );
        continue;
      }
      if (this.checkForShadowing(paramNode.ident.name, funcScope, "Parameter", paramNode.ident.span)) {
        continue;
      }
      this.checkForShadowing(paramNode.ident.name, funcScope, "Parameter", paramNode.ident.span, true);
      seenParams.add(paramNode.ident.name);
      const paramSymbol = this.createParamSymbol(paramNode, funcScope, moduleName);
      this.config.services.scopeManager.addSymbolToScope(paramSymbol, funcScope.id);
      this.incrementSymbolsCollected();
      collectedParams.push(paramSymbol);
      if (paramNode.type) {
        if (paramNode.type.isStruct() || paramNode.type.isEnum()) {
          const typeScopeName = `${paramNode.ident.name}-type`;
          const typeScope = this.createTypeScope(typeScopeName, funcScope);
          if (paramNode.type.isStruct()) {
            const struct = paramNode.type.getStruct();
            struct.metadata = __spreadProps(__spreadValues2({}, struct.metadata), { scopeId: typeScope.id });
          } else if (paramNode.type.isEnum()) {
            const enumType = paramNode.type.getEnum();
            enumType.metadata = __spreadProps(__spreadValues2({}, enumType.metadata), { scopeId: typeScope.id });
          }
          this.collectType(paramNode.type, funcScope, moduleName, typeScopeName);
        } else {
          this.collectType(paramNode.type, funcScope, moduleName, paramNode.ident.name);
        }
      }
    }
    return collectedParams;
  }
  injectSelfParameter(funcScope, structScope, moduleName) {
    const structType = TypeNode.asIdentifier(
      { start: 0, end: 0 },
      structScope.name
    );
    const selfSymbol = {
      id: this.config.services.scopeManager.symbolIdGenerator.next(),
      name: "self",
      kind: "Parameter",
      type: structType,
      scope: funcScope.id,
      contextSpan: { start: 0, end: 0 },
      // Synthetic - no source location
      targetSpan: { start: 0, end: 0 },
      declared: true,
      initialized: true,
      used: true,
      // ✅ Mark as used by default since it's implicit
      visibility: { kind: "Private" },
      mutability: { kind: "Immutable" },
      isTypeChecked: false,
      isExported: false,
      module: moduleName,
      metadata: {
        isSynthetic: true,
        isSelf: true
      }
    };
    this.config.services.scopeManager.addSymbolToScope(selfSymbol, funcScope.id);
    this.stats.syntheticSymbolsInjected++;
    this.incrementSymbolsCollected();
    this.log("symbols", `Injected implicit 'self' parameter in struct method '${funcScope.name}'`);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.6] LOOP ─────────────────────────────┐
  handleLoopStmt(stmt, scope, moduleName) {
    if (stmt.getLoop === void 0) {
      const data = stmt;
      switch (stmt.kind) {
        case "While": {
          const src = data.source;
          const loop = LoopStmtNode.createWhile(data.span, src.expr, src.stmt);
          this.collectLoopStmt(loop, scope, moduleName);
          break;
        }
        case "Do": {
          const src = data.source;
          const loop = LoopStmtNode.createDo(data.span, src.expr, src.stmt);
          this.collectLoopStmt(loop, scope, moduleName);
          break;
        }
        case "For": {
          const src = data.source;
          const loop = LoopStmtNode.createFor(data.span, src.expr, src.stmt);
          this.collectLoopStmt(loop, scope, moduleName);
          break;
        }
      }
    } else {
      this.collectLoopStmt(stmt.getLoop(), scope, moduleName);
    }
  }
  createLoopScope(parentScope) {
    const loopScope = this.config.services.scopeManager.createScope("Loop", "loop", parentScope.id);
    this.incrementScopesCreated();
    this.log("scopes", `Created loop scope ${loopScope.id} under parent ${parentScope.id}`);
    return loopScope;
  }
  collectLoopStmt(loopNode, parentScope, moduleName) {
    const loopScope = this.createLoopScope(parentScope);
    this.config.services.scopeManager.withScope(loopScope.id, () => {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.contextTracker.setScope(loopScope.id);
        switch (loopNode.kind) {
          case "While":
            this.collectExpr(loopNode.expr, loopScope, moduleName);
            this.collectStmt(loopNode.stmt, loopScope, moduleName);
            break;
          case "Do":
            this.collectStmt(loopNode.stmt, loopScope, moduleName);
            this.collectExpr(loopNode.expr, loopScope, moduleName);
            break;
          case "For":
            this.collectExpr(loopNode.expr, loopScope, moduleName);
            this.collectStmt(loopNode.stmt, loopScope, moduleName);
            break;
        }
      });
    });
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────── [3.7] CTRLFLOW ──────────────────────────┐
  handleControlflowStmt(stmt, scope, moduleName) {
    if (stmt.getCtrlflow === void 0) {
      const data = stmt;
      switch (stmt.kind) {
        case "Return": {
          const src = data.source;
          const res = ControlFlowStmtNode.asReturn(data.span, src.value);
          this.collectReturnStmt(res, scope, moduleName);
          break;
        }
        case "Defer": {
          const src = data.source;
          const res = ControlFlowStmtNode.asDefer(data.span, src.value);
          this.collectDeferStmt(res, scope, moduleName);
          break;
        }
        case "Throw": {
          const src = data.source;
          const res = ControlFlowStmtNode.asThrow(data.span, src.value);
          this.collectThrowStmt(res, scope, moduleName);
          break;
        }
      }
    } else {
      switch (stmt.getCtrlflow().kind) {
        case "return": {
          this.collectReturnStmt(stmt.getCtrlflow(), scope, moduleName);
          break;
        }
        case "defer": {
          this.collectDeferStmt(stmt.getCtrlflow(), scope, moduleName);
          break;
        }
        case "throw": {
          this.collectThrowStmt(stmt.getCtrlflow(), scope, moduleName);
          break;
        }
      }
    }
  }
  collectReturnStmt(returnNode, scope, moduleName) {
    if (returnNode.value) {
      this.collectExpr(returnNode.value, scope, moduleName);
    }
  }
  collectDeferStmt(deferNode, scope, moduleName) {
    if (deferNode.value) {
      this.collectExpr(deferNode.value, scope, moduleName);
    }
  }
  collectThrowStmt(throwNode, scope, moduleName) {
    if (throwNode.value) {
      this.collectExpr(throwNode.value, scope, moduleName);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [4] EXPR Level ───────────────────────────┐
  createExprScope(parentScope) {
    const exprScope = this.config.services.scopeManager.createScope("Expression", "expr", parentScope.id);
    this.incrementScopesCreated();
    return exprScope;
  }
  collectExpr(expr, currentScope, moduleName) {
    let needsScope = false;
    switch (expr.kind) {
      case "If":
      case "Switch":
      case "Try":
      case "Catch":
        needsScope = true;
        break;
    }
    if (needsScope) {
      const exprScope = this.createExprScope(currentScope);
      this.config.services.scopeManager.withScope(exprScope.id, () => {
        this.config.services.contextTracker.withSavedState(() => {
          this.config.services.contextTracker.setScope(exprScope.id);
          this.processExprKind(expr, exprScope, moduleName);
        });
      });
    } else {
      this.processExprKind(expr, currentScope, moduleName);
    }
  }
  processExprKind(expr, scope, moduleName) {
    switch (expr.kind) {
      case "As":
        this.handleAsExpr(expr.getAs(), scope, moduleName);
        break;
      case "Typeof":
        return this.processExprKind(expr.getTypeof().expr, scope, moduleName);
      case "Sizeof":
        return this.processExprKind(expr.getSizeof().expr, scope, moduleName);
      case "Orelse":
        this.handleOrelseExpr(expr.getOrelse(), scope, moduleName);
        break;
      case "Range":
        this.handleRangeExpr(expr.getRange(), scope, moduleName);
        break;
      case "Try":
        this.handleTryExpr(expr.getTry(), scope, moduleName);
        break;
      case "Catch":
        this.handleCatchExpr(expr.getCatch(), scope, moduleName);
        break;
      case "If":
        this.handleIfExpr(expr.getIf(), scope, moduleName);
        break;
      case "Switch":
        this.handleSwitchExpr(expr.getSwitch(), scope, moduleName);
        break;
      case "Binary":
        this.handleBinaryExpr(expr.getBinary(), scope, moduleName);
        break;
      case "Postfix":
        this.handlePostfixExpr(expr.getPostfix(), scope, moduleName);
        break;
      case "Prefix":
        this.handlePrefixExpr(expr.getPrefix(), scope, moduleName);
        break;
      case "Primary":
        this.handlePrimaryExpr(expr.getPrimary(), scope, moduleName);
        break;
    }
  }
  handleAsExpr(asExpr, scope, moduleName) {
    this.collectType(asExpr.type, scope, moduleName);
    this.collectExpr(asExpr.base, scope, moduleName);
  }
  handleOrelseExpr(orelseExpr, scope, moduleName) {
    this.collectExpr(orelseExpr.left, scope, moduleName);
    this.collectExpr(orelseExpr.right, scope, moduleName);
  }
  handleRangeExpr(rangeExpr, scope, moduleName) {
    if (rangeExpr.leftExpr) this.collectExpr(rangeExpr.leftExpr, scope, moduleName);
    if (rangeExpr.rightExpr) this.collectExpr(rangeExpr.rightExpr, scope, moduleName);
  }
  handleTryExpr(tryExpr, scope, moduleName) {
    this.collectExpr(tryExpr.expr, scope, moduleName);
  }
  handleCatchExpr(catchExpr, scope, moduleName) {
    this.collectExpr(catchExpr.leftExpr, scope, moduleName);
    this.collectStmt(catchExpr.rightStmt, scope, moduleName);
  }
  handleIfExpr(ifExpr, scope, moduleName) {
    this.collectExpr(ifExpr.condExpr, scope, moduleName);
    this.collectStmt(ifExpr.thenStmt, scope, moduleName);
    if (ifExpr.elseStmt) {
      this.collectStmt(ifExpr.elseStmt, scope, moduleName);
    }
  }
  handleSwitchExpr(switchExpr, scope, moduleName) {
    this.collectExpr(switchExpr.condExpr, scope, moduleName);
    for (const switchCase of switchExpr.cases) {
      if (switchCase.expr) this.collectExpr(switchCase.expr, scope, moduleName);
      if (switchCase.stmt) this.collectStmt(switchCase.stmt, scope, moduleName);
    }
    if (switchExpr.defCase) {
      this.collectStmt(switchExpr.defCase.stmt, scope, moduleName);
    }
  }
  handleBinaryExpr(binaryExpr, scope, moduleName) {
    this.collectExpr(binaryExpr.left, scope, moduleName);
    this.collectExpr(binaryExpr.right, scope, moduleName);
  }
  handlePostfixExpr(postfixExpr, scope, moduleName) {
    switch (postfixExpr.kind) {
      case "Increment":
      case "Decrement":
      case "Dereference":
        this.collectExpr(postfixExpr.getAsExprNode(), scope, moduleName);
        break;
      case "Call": {
        const callExpr = postfixExpr.getCall();
        this.collectExpr(callExpr.base, scope, moduleName);
        for (const arg of callExpr.args) {
          this.collectExpr(arg, scope, moduleName);
        }
        break;
      }
      case "ArrayAccess": {
        const arrayAccess = postfixExpr.getArrayAccess();
        this.collectExpr(arrayAccess.base, scope, moduleName);
        this.collectExpr(arrayAccess.index, scope, moduleName);
        break;
      }
      case "MemberAccess": {
        const memberAccess = postfixExpr.getMemberAccess();
        this.collectExpr(memberAccess.base, scope, moduleName);
        break;
      }
    }
  }
  handlePrefixExpr(prefixExpr, scope, moduleName) {
    this.collectExpr(prefixExpr.expr, scope, moduleName);
  }
  handlePrimaryExpr(primaryExpr, scope, moduleName) {
    switch (primaryExpr.kind) {
      case "Ident": {
        const ident = primaryExpr.getIdent();
        if (ident && ident.name === "self") {
          this.validateSelfUsage(scope, ident.span);
        }
        break;
      }
      case "Literal":
        break;
      case "Type": {
        const type = primaryExpr.getType();
        this.collectType(type, scope, moduleName);
        break;
      }
      case "Paren": {
        const paren = primaryExpr.getParen();
        this.collectExpr(paren.source, scope, moduleName);
        break;
      }
      case "Tuple": {
        const tuple = primaryExpr.getTuple();
        for (const expr of tuple.fields) {
          this.collectExpr(expr, scope, moduleName);
        }
        break;
      }
      case "Object": {
        const object = primaryExpr.getObject();
        if (object.ident) {
          this.collectExpr(
            ExprNode.asIdent(object.ident.span, object.ident.name),
            scope,
            moduleName
          );
        }
        for (const field of object.props) {
          if (field.val) this.collectExpr(field.val, scope, moduleName);
        }
        break;
      }
    }
  }
  validateSelfUsage(currentScope, span) {
    var _a, _b;
    let checkScope = currentScope;
    let isInStaticMethod = false;
    let structScope = null;
    while (checkScope) {
      if (checkScope.kind === "Function") {
        const parentScope = checkScope.parent !== null ? this.config.services.scopeManager.getScope(checkScope.parent) : null;
        if ((parentScope == null ? void 0 : parentScope.kind) === "Type" && ((_a = parentScope.metadata) == null ? void 0 : _a.typeKind) === "Struct") {
          structScope = parentScope;
          const funcSymbol = parentScope.symbols.get(checkScope.name);
          if (funcSymbol && funcSymbol.visibility.kind === "Static") {
            isInStaticMethod = true;
          }
          break;
        }
      }
      checkScope = checkScope.parent !== null ? this.config.services.scopeManager.getScope(checkScope.parent) : null;
    }
    if (isInStaticMethod && structScope) {
      return;
    }
    const selfSymbol = this.config.services.scopeManager.lookupSymbolInScopeChain("self", currentScope.id);
    if (!selfSymbol || !((_b = selfSymbol.metadata) == null ? void 0 : _b.isSelf)) {
      this.reportError(
        "UNDEFINED_IDENTIFIER",
        "Undefined identifier 'self' - can only be used in struct instance methods",
        span
      );
      return;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [5] Type Level ───────────────────────────┐
  createTypeScope(typeName, parentScope, typeKind) {
    const typeScope = this.config.services.scopeManager.createScope("Type", typeName, parentScope.id);
    if (typeKind) {
      typeScope.metadata = __spreadProps(__spreadValues2({}, typeScope.metadata), {
        typeKind
      });
    }
    this.incrementScopesCreated();
    return typeScope;
  }
  collectType(type, parentScope, moduleName, newScopeName) {
    if (!type) return;
    this.withTypeContext(type, newScopeName, () => {
      this.collectTypeInternal(type, parentScope, moduleName, newScopeName);
    });
  }
  collectTypeInternal(type, parentScope, moduleName, newScopeName) {
    let needsScope = false;
    let typeName = "Anonymous";
    let typeScope = parentScope;
    switch (type.kind) {
      case "struct":
        needsScope = true;
        if (newScopeName) {
          typeName = newScopeName;
        } else {
          const anonId = this.config.services.scopeManager.symbolIdGenerator.next();
          typeName = `<anonymous-struct-${anonId}>`;
        }
        break;
      case "enum":
        needsScope = true;
        if (newScopeName) {
          typeName = newScopeName;
        } else {
          const anonId = this.config.services.scopeManager.symbolIdGenerator.next();
          typeName = `<anonymous-enum-${anonId}>`;
        }
        break;
      case "errset":
        needsScope = true;
        typeName = newScopeName || "<anonymous-error>";
        break;
    }
    if (needsScope) {
      typeScope = this.createTypeScope(typeName, parentScope);
      switch (type.kind) {
        case "struct":
          typeScope.metadata = __spreadProps(__spreadValues2({}, typeScope.metadata), { typeKind: "Struct" });
          break;
        case "enum":
          typeScope.metadata = __spreadProps(__spreadValues2({}, typeScope.metadata), { typeKind: "Enum" });
          break;
        case "errset":
          typeScope.metadata = __spreadProps(__spreadValues2({}, typeScope.metadata), { typeKind: "Error" });
          break;
      }
      if (!this.config.services.scopeManager.getScope(typeScope.id)) {
        throw new Error(`Invalid scope ID ${typeScope.id} for type ${typeName}`);
      }
    }
    try {
      switch (type.kind) {
        case "struct":
          this.handleStructType(type.getStruct(), typeScope, moduleName);
          break;
        case "enum":
          this.handleEnumType(type.getEnum(), typeScope, moduleName);
          break;
        case "errset":
          this.collectErrorType(type.getError(), typeScope, moduleName);
          break;
        case "tuple":
          this.handleTupleType(type.getTuple(), parentScope, moduleName);
          break;
        case "array":
          this.handleArrayType(type.getArray(), parentScope, moduleName);
          break;
        case "optional":
          this.handleOptionalType(type.getOptional(), parentScope, moduleName);
          break;
        case "pointer":
          this.handlePointerType(type.getPointer(), parentScope, moduleName);
          break;
        case "function":
          this.handleFunctionType(type.getFunction(), parentScope, moduleName);
          break;
        case "union":
          this.handleUnionType(type.getUnion(), parentScope, moduleName);
          break;
        case "paren":
          this.collectTypeInternal(type.getParen().type, parentScope, moduleName);
      }
    } catch (error) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Failed to collect type ${type.kind}: ${error}`
      );
    }
  }
  handleStructType(structType, typeScope, moduleName) {
    structType.metadata = __spreadProps(__spreadValues2({}, structType.metadata), { scopeId: typeScope.id });
    typeScope.metadata = __spreadProps(__spreadValues2({}, typeScope.metadata), {
      typeKind: "Struct"
      // ✅ This line exists but might not be executing
    });
    for (const member of structType.members) {
      if (!member || !member.kind || !member.source) {
        continue;
      }
      if (member.isField()) {
        this.collectStructField(member.source, typeScope, moduleName);
      } else {
        this.collectFuncStmt(member.source, typeScope, moduleName);
      }
    }
  }
  handleEnumType(enumType, typeScope, moduleName) {
    enumType.metadata = __spreadProps(__spreadValues2({}, enumType.metadata), { scopeId: typeScope.id });
    for (const variant of enumType.variants) {
      if (typeScope.symbols.has(variant.ident.name)) {
        this.reportError(
          "ENUM_VARIANT_SHADOWING",
          `Duplicate enum variant '${variant.ident.name}'`,
          variant.ident.span
        );
        continue;
      }
      if (variant.type) {
        const variantScope = this.createTypeScope(variant.ident.name, typeScope);
        if (variant.type.isStruct()) {
          const structType = variant.type.getStruct();
          structType.metadata = __spreadProps(__spreadValues2({}, structType.metadata), {
            scopeId: variantScope.id
          });
          this.config.services.scopeManager.withScope(variantScope.id, () => {
            this.config.services.contextTracker.withSavedState(() => {
              this.config.services.contextTracker.setScope(variantScope.id);
              this.collectType(variant.type, variantScope, moduleName, variant.ident.name);
            });
          });
        } else {
          this.collectType(variant.type, typeScope, moduleName);
        }
      } else {
        this.collectEnumVariantIdent(variant.ident, typeScope, moduleName);
      }
    }
  }
  handleTupleType(tupleType, parentScope, moduleName) {
    for (const field of tupleType.fields) {
      this.collectType(field, parentScope, moduleName);
    }
  }
  handleArrayType(arrayType, parentScope, moduleName) {
    this.collectType(arrayType.target, parentScope, moduleName);
    if (arrayType.size) this.collectExpr(arrayType.size, parentScope, moduleName);
  }
  handleOptionalType(optionalType, parentScope, moduleName) {
    this.collectType(optionalType.target, parentScope, moduleName);
  }
  handlePointerType(pointerType, parentScope, moduleName) {
    this.collectType(pointerType.target, parentScope, moduleName);
  }
  handleFunctionType(funcType, parentScope, moduleName) {
    for (const param of funcType.params) {
      if (param) {
        this.collectType(param, parentScope, moduleName);
      }
    }
    if (funcType.returnType) {
      this.collectType(funcType.returnType, parentScope, moduleName);
    }
    if (funcType.errorType) {
      this.collectType(funcType.errorType, parentScope, moduleName);
    }
  }
  handleUnionType(unionType, parentScope, moduleName) {
    for (const variant of unionType.types) {
      this.collectType(variant, parentScope, moduleName);
    }
  }
  collectStructField(fieldNode, scope, moduleName) {
    this.log("symbols", `Collecting structure field '${fieldNode.ident.name}'`);
    if (this.checkForShadowing(fieldNode.ident.name, scope, "StructField", fieldNode.ident.span, false)) {
      return;
    }
    const symbol = this.createStructFieldSymbol(fieldNode, scope, moduleName);
    this.config.services.scopeManager.addSymbolToScope(symbol, scope.id);
    this.incrementSymbolsCollected();
    if (fieldNode.type) {
      this.collectType(fieldNode.type, scope, moduleName);
    }
    if (fieldNode.initializer) {
      this.collectExpr(fieldNode.initializer, scope, moduleName);
    }
  }
  createStructFieldSymbol(fieldNode, scope, moduleName) {
    var _a, _b;
    const symbol = this.createBaseSymbol(
      fieldNode.ident.name,
      "StructField",
      scope,
      moduleName,
      fieldNode.span,
      fieldNode.ident.span
    );
    return __spreadProps(__spreadValues2({}, symbol), {
      type: (_a = fieldNode.type) != null ? _a : null,
      initialized: !!fieldNode.initializer,
      visibility: (_b = fieldNode.visibility) != null ? _b : "Private",
      mutability: fieldNode.mutability
      // ✅ Added
    });
  }
  collectEnumVariantIdent(identNode, scope, moduleName) {
    const symbol = this.createEnumVariantSymbol(identNode, scope, moduleName);
    this.config.services.scopeManager.addSymbolToScope(symbol, scope.id);
    this.incrementSymbolsCollected();
  }
  createEnumVariantSymbol(identNode, scope, moduleName) {
    return this.createBaseSymbol(
      identNode.name,
      "EnumVariant",
      scope,
      moduleName,
      identNode.span,
      identNode.span
    );
  }
  collectErrorType(errorType, scope, moduleName) {
    if (errorType.members.length === 0) return;
    const seenErrors = /* @__PURE__ */ new Set();
    for (const error of errorType.members) {
      if (seenErrors.has(error.name)) {
        this.reportError(
          "ERROR_SHADOWING",
          `Duplicate error member '${error.name}'`,
          error.span
        );
        continue;
      }
      seenErrors.add(error.name);
      const symbol = this.createErrorSymbol(error, scope, moduleName);
      this.config.services.scopeManager.addSymbolToScope(symbol, scope.id);
      this.incrementSymbolsCollected();
    }
  }
  createErrorSymbol(error, scope, moduleName) {
    return this.createBaseSymbol(
      error.name,
      "Error",
      scope,
      moduleName,
      error.span,
      error.span
    );
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [x] VALIDATION ───────────────────────────┐
  checkForShadowing(newSymbolName, currentScope, newSymbolKind, span, outer = false) {
    var _a;
    if (newSymbolName === "self") {
      const existingSymbol2 = outer ? this.config.services.scopeManager.lookupSymbolInParentScopes("self", currentScope.id) : currentScope.symbols.get("self") || this.config.services.scopeManager.lookupSymbolInParentScopes("self", currentScope.id);
      if (existingSymbol2 && ((_a = existingSymbol2.metadata) == null ? void 0 : _a.isSelf)) {
        this.reportError(
          newSymbolKind === "Parameter" ? "PARAMETER_SHADOWING" : "VARIABLE_SHADOWING",
          newSymbolKind === "Parameter" ? `Duplicate parameter name 'self'` : `Symbol 'self' shadows parameter 'self' in ${outer ? "outer" : "same"} scope`,
          span
        );
        return true;
      }
    }
    if (newSymbolName.startsWith("@")) {
      this.reportError(
        "DUPLICATE_SYMBOL",
        `Cannot shadow built-in symbol '${newSymbolName}'`,
        span
      );
      return true;
    }
    const existingSymbol = outer ? this.config.services.scopeManager.lookupSymbolInParentScopes(newSymbolName, currentScope.id) : currentScope.symbols.get(newSymbolName);
    if (existingSymbol) {
      const isInTypeScope = currentScope.kind === "Type";
      const existingIsInTypeScope = this.config.services.scopeManager.getScope(existingSymbol.scope).kind === "Type";
      if (isInTypeScope !== existingIsInTypeScope && outer) {
        this.log(
          "verbose",
          `Symbol '${newSymbolName}' in type scope doesn't shadow module-level symbol (different namespaces)`
        );
        return false;
      }
      let diagnosticCode;
      let severity = "error";
      switch (newSymbolKind) {
        case "Use":
          diagnosticCode = "USE_SHADOWING";
          break;
        case "Definition":
          diagnosticCode = "DEFINITION_SHADOWING";
          break;
        case "Variable":
          diagnosticCode = "VARIABLE_SHADOWING";
          if (outer) severity = "warning";
          break;
        case "Function":
          diagnosticCode = "FUNCTION_SHADOWING";
          if (outer) severity = "warning";
          break;
        case "Parameter":
          diagnosticCode = "PARAMETER_SHADOWING";
          if (outer) severity = "warning";
          break;
        case "StructField":
          diagnosticCode = "STRUCT_FIELD_SHADOWING";
          break;
        case "EnumVariant":
          diagnosticCode = "ENUM_VARIANT_SHADOWING";
          break;
        case "Error":
          diagnosticCode = "ERROR_SHADOWING";
          break;
        default:
          return false;
      }
      const message = `Symbol '${newSymbolName}' shadows ${existingSymbol.kind.toLowerCase()} '${existingSymbol.name}' in ${outer ? "outer" : "same"} scope`;
      if (severity === "warning") {
        this.reportWarning(diagnosticCode, message, span);
      } else {
        this.reportError(diagnosticCode, message, span);
      }
      return severity === "error" ? !outer : false;
    }
    return false;
  }
  checkTypeCycle(type, scopeName) {
    const typeKey = this.createTypeKey(type, scopeName);
    if (this.typeContext.visitedTypes.has(typeKey)) {
      this.log("verbose", `Cycle detected in type: ${typeKey}`);
      this.log("verbose", `Type path: ${this.typeContext.currentTypePath.join(" -> ")}`);
      this.reportWarning(
        "TYPE_CYCLE_DETECTE",
        `Circular type reference detected for ${type.kind} (this is OK for pointer types)`,
        type.span
      );
      this.log("verbose", `Valid pointer cycle: ${typeKey}`);
      return false;
    }
    if (this.typeContext.nestingDepth > this.typeContext.maxNestingDepth) {
      this.typeContext.maxNestingDepth = this.typeContext.nestingDepth;
    }
    if (this.typeContext.nestingDepth > 100) {
      this.reportError(
        "TYPE_NESTING_TOO_DEEP",
        // `Type nesting exceeds safety limit (${this.typeContext.nestingDepth} levels) - possible infinite recursion`,
        `Type nesting exceeds safety limit`,
        type.span
      );
      return true;
    }
    return false;
  }
  withTypeContext(type, scopeName, operation) {
    const typeKey = this.createTypeKey(type, scopeName);
    if (this.checkTypeCycle(type, scopeName)) {
      return;
    }
    this.typeContext.visitedTypes.add(typeKey);
    this.typeContext.currentTypePath.push(typeKey);
    this.typeContext.nestingDepth++;
    try {
      operation();
    } finally {
      this.typeContext.visitedTypes.delete(typeKey);
      this.typeContext.currentTypePath.pop();
      this.typeContext.nestingDepth--;
    }
  }
  validateSymbolExistsInModule(module, symbolName) {
    for (const stmt of module.statements) {
      if (stmt.kind === "Let") {
        const varNode = stmt.getLet();
        if (varNode && varNode.field.ident.name === symbolName) {
          return true;
        }
      } else if (stmt.kind === "Func") {
        const funcNode = stmt.getFunc();
        if (funcNode && funcNode.ident.name === symbolName) {
          return true;
        }
      } else if (stmt.kind === "Def") {
        const defNode = stmt.getDef();
        if (defNode && defNode.ident.name === symbolName) {
          return true;
        }
      }
    }
    return false;
  }
  validateMemberPathInModule(module, memberPath, useNode) {
    if (!memberPath) {
      return true;
    }
    if (memberPath.length === 0) return false;
    if (memberPath.length === 1) {
      return this.validateSymbolExistsInModule(module, memberPath[0].name);
    }
    let currentSymbolName = memberPath[0].name;
    if (!this.validateSymbolExistsInModule(module, currentSymbolName)) {
      this.reportError(
        "SYMBOL_NOT_FOUND",
        `Symbol '${currentSymbolName}' not found in module`,
        memberPath[0].span
      );
      return false;
    }
    this.log(
      "verbose",
      `Member path ${memberPath.map((m) => m.name).join(".")} found in module (full validation deferred to type checking)`
    );
    return true;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  init() {
    var _a;
    this.pathContext.rootPath = (_a = this.config.program.metadata) == null ? void 0 : _a.path;
    this.config.services.contextTracker.reset();
    this.config.services.contextTracker.setPhase(
      "Collection"
      /* Collection */
    );
    if (!this.config.program) {
      this.reportError("ANALYSIS_ERROR", "No program provided for analysis");
      return false;
    }
    try {
      this.config.services.scopeManager.reset();
      const globalScope = this.config.services.scopeManager.getCurrentScope();
      if (globalScope.kind !== "Global") {
        this.reportError("INTERNAL_ERROR", "Current scope is not global at the start of symbol collection");
        return false;
      }
      this.incrementScopesCreated();
    } catch (error) {
      this.reportError("INTERNAL_ERROR", `Failed to initialize scope manager: ${error}`);
      return false;
    }
    return true;
  }
  initStats() {
    return {
      modulesProcessed: 0,
      symbolsCollected: 0,
      importResolutionFailures: 0,
      scopesCreated: 0,
      syntheticSymbolsInjected: 0,
      startTime: Date.now()
    };
  }
  initTypeContext() {
    return {
      visitedTypes: /* @__PURE__ */ new Set(),
      currentTypePath: [],
      nestingDepth: 0,
      maxNestingDepth: 0
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  createTypeKey(type, scopeName) {
    const baseKey = `${type.kind}:${type.span.start}:${type.span.end}`;
    return scopeName ? `${baseKey}:${scopeName}` : baseKey;
  }
  createBaseSymbol(name, kind, scope, moduleName, contextSpan, targetSpan) {
    return {
      id: this.config.services.scopeManager.symbolIdGenerator.next(),
      name,
      kind,
      module: moduleName,
      scope: scope.id,
      contextSpan,
      targetSpan,
      type: null,
      declared: true,
      initialized: false,
      used: false,
      visibility: { kind: "Private" },
      mutability: { kind: "Immutable" },
      isTypeChecked: false,
      isExported: false
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  incrementSymbolsCollected() {
    this.stats.symbolsCollected++;
  }
  incrementScopesCreated() {
    this.stats.scopesCreated++;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  trackModuleExport(moduleName, symbolName, isExported) {
    if (!isExported) return;
    if (!this.moduleExports.has(moduleName)) {
      this.moduleExports.set(moduleName, /* @__PURE__ */ new Set());
    }
    this.moduleExports.get(moduleName).add(symbolName);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  logStatistics() {
    const duration = Date.now() - this.stats.startTime;
    const stats = [
      `Collection Statistics:`,
      `  Duration             : ${duration}ms`,
      `  Modules processed    : ${this.stats.modulesProcessed}`,
      `  Symbols collected    : ${this.stats.symbolsCollected}`,
      `  Scopes created       : ${this.stats.scopesCreated}`,
      `  Import failures      : ${this.stats.importResolutionFailures}`,
      `  Max type nesting     : ${this.typeContext.maxNestingDepth}`
    ];
    this.log("verbose", stats.join("\n"));
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  getTypeRegistry() {
    return new Map(this.typeRegistry);
  }
  getModuleExports(moduleName) {
    return this.moduleExports.get(moduleName);
  }
  canImportSymbol(moduleName, symbolName) {
    const exports = this.moduleExports.get(moduleName);
    return exports ? exports.has(symbolName) : false;
  }
  // └──────────────────────────────────────────────────────────────────────┘
};
var SymbolResolver = class extends PhaseBase {
  constructor(config) {
    super("Resolution", config);
    this.stats = this.initStats();
    this.resolutionCtx = this.initResolutionContext();
    this.currentIsStaticMethod = false;
    this.currentStructScope = null;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  handle() {
    try {
      this.log("verbose", "Starting symbol resolution phase...");
      this.stats.startTime = Date.now();
      if (!this.init()) return false;
      if (!this.resolveAllModules()) return false;
      this.logStatistics();
      return !this.config.services.diagnosticManager.hasErrors();
    } catch (error) {
      this.log("errors", `Fatal error during symbol resolution: ${error}`);
      this.reportError("INTERNAL_ERROR", `Fatal error during symbol resolution: ${error}`);
      return false;
    }
  }
  reset() {
    this.stats = this.initStats();
    this.resolutionCtx = this.initResolutionContext();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────── [1] Program Level ─────────────────────────┐
  resolveAllModules() {
    this.log("verbose", "Resolving symbols from all modules...");
    const globalScope = this.config.services.scopeManager.getCurrentScope();
    for (const [moduleName, module] of this.config.program.modules) {
      this.config.services.contextTracker.pushContextSpan({ start: 0, end: 0 });
      try {
        if (!this.resolveModule(moduleName, module, globalScope)) {
          this.log("errors", `Failed to resolve module ${moduleName}, continuing...`);
        }
        this.stats.modulesProcessed++;
      } finally {
        this.config.services.contextTracker.popContextSpan();
      }
    }
    return true;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────── [2] Module Level ──────────────────────────┐
  resolveModule(moduleName, module, parentScope) {
    var _a;
    this.log("symbols", `Resolving module '${moduleName}'`);
    try {
      this.config.services.contextTracker.setModuleName(moduleName);
      if (typeof ((_a = module.metadata) == null ? void 0 : _a.path) === "string") {
        this.config.services.contextTracker.setModulePath(module.metadata.path);
      }
      this.enterModuleContext(moduleName, module);
      const moduleScope = this.findModuleScope(moduleName);
      if (!moduleScope) {
        this.reportError("MODULE_SCOPE_NOT_FOUND", `Module scope for '${moduleName}' not found`);
        return false;
      }
      this.config.services.scopeManager.setCurrentScope(moduleScope.id);
      this.config.services.contextTracker.setScope(moduleScope.id);
      ;
      this.resetDeclaredFlags(moduleScope);
      for (const statement of module.statements) {
        this.resolveStmt(statement, moduleScope, moduleName);
      }
      this.exitModuleContext();
      return true;
    } catch (error) {
      this.reportError("INTERNAL_ERROR", `Failed to resolve module '${moduleName}': ${error}`);
      return false;
    }
  }
  resetDeclaredFlags(scope) {
    for (const [_, symbol] of scope.symbols) {
      if (symbol.kind !== "Use" && symbol.kind !== "Parameter") {
        symbol.declared = false;
      }
    }
    const childScopes = this.config.services.scopeManager.getAllScopes().filter((s) => s.parent === scope.id);
    for (const childScope of childScopes) {
      this.resetDeclaredFlags(childScope);
    }
  }
  enterModuleContext(moduleName, module) {
    var _a;
    this.resolutionCtx.moduleStack.push(this.resolutionCtx.currentModule);
    this.resolutionCtx.currentModule = moduleName;
    this.config.services.contextTracker.setModuleName(moduleName);
    if (typeof ((_a = module.metadata) == null ? void 0 : _a.path) === "string") {
      this.config.services.contextTracker.setModulePath(module.metadata.path);
    }
  }
  exitModuleContext() {
    const previousModule = this.resolutionCtx.moduleStack.pop();
    this.resolutionCtx.currentModule = previousModule || "";
  }
  findModuleScope(moduleName) {
    const moduleScope = this.config.services.scopeManager.findScopeByName(
      moduleName,
      "Module"
      /* Module */
    );
    if (!moduleScope) {
      this.reportError("MODULE_SCOPE_NOT_FOUND", `Module scope for '${moduleName}' not found`);
    }
    return moduleScope;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [3] Stmt Level ───────────────────────────┐
  resolveStmt(stmt, currentScope, moduleName) {
    if (!stmt) {
      this.reportError("ANALYSIS_ERROR", "Found null statement during resolution");
      return;
    }
    this.log("verbose", `Resolving ${stmt.kind} statement`);
    this.config.services.contextTracker.pushContextSpan(stmt.span);
    try {
      this.config.services.scopeManager.withScope(currentScope.id, () => {
        this.config.services.contextTracker.withSavedState(() => {
          this.config.services.contextTracker.setScope(currentScope.id);
          this.processStmt(stmt, currentScope, moduleName);
        });
      });
    } catch (error) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Failed to resolve ${stmt.kind} statement: ${error}`,
        stmt.span
      );
    } finally {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  processStmt(stmt, currentScope, moduleName) {
    const nodeGetter = this.getNodeGetter(stmt);
    if (!nodeGetter) {
      this.reportError("INTERNAL_ERROR", `Invalid AST: ${stmt.kind} node is null`);
      return;
    }
    switch (stmt.kind) {
      case "Block":
        this.handleBlockStmt(stmt.getBlock(), currentScope, moduleName);
        break;
      case "Test":
        this.handleTestStmt(stmt.getTest(), currentScope, moduleName);
        break;
      case "Use":
        this.handleUseStmt(stmt.getUse(), currentScope, moduleName);
        break;
      case "Def":
        this.handleDefStmt(stmt.getDef(), currentScope, moduleName);
        break;
      case "Let":
        this.handleLetStmt(stmt.getLet(), currentScope, moduleName);
        break;
      case "Func":
        this.handleFuncStmt(stmt.getFunc(), currentScope, moduleName);
        break;
      case "While":
      case "Do":
      case "For":
        this.handleLoopStmt(stmt, currentScope, moduleName);
        break;
      case "Return":
      case "Defer":
      case "Throw":
        this.handleControlflowStmt(stmt, currentScope, moduleName);
        break;
      case "Expression":
        this.resolveExprStmt(stmt.getExpr());
        break;
    }
  }
  getNodeGetter(stmt) {
    switch (stmt.kind) {
      case "Def":
        return () => stmt.getDef();
      case "Use":
        return () => stmt.getUse();
      case "Let":
        return () => stmt.getLet();
      case "Func":
        return () => stmt.getFunc();
      case "Block":
        return () => stmt.getBlock();
      case "Return":
        return () => stmt.getReturn();
      case "Defer":
        return () => stmt.getDefer();
      case "Throw":
        return () => stmt.getThrow();
      case "Expression":
        return () => stmt.getExpr();
      case "While":
      case "Do":
      case "For":
        return () => stmt.getLoop();
      case "Break":
        return () => stmt.getBreak();
      case "Continue":
        return () => stmt.getContinue();
      case "Test":
        return () => stmt.getTest();
      default:
        return null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────── [3.1] BLOCK ─────────────────────────────┐
  handleBlockStmt(blockNode, scope, moduleName) {
    this.resolveBlockStmt(blockNode);
  }
  resolveBlockStmt(block) {
    this.log("symbols", "Resolving block");
    const blockScope = this.config.services.scopeManager.findChildScopeByName(
      "block",
      "Block"
      /* Block */
    );
    if (blockScope) {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.contextTracker.setScope(blockScope.id);
        this.config.services.scopeManager.withScope(blockScope.id, () => {
          for (const stmt of block.stmts) {
            this.resolveStmt(stmt, blockScope);
          }
        });
      });
    }
  }
  handleTestStmt(testNode, scope, moduleName) {
    this.resolveBlockStmt(testNode.block);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.2] USE ──────────────────────────────┐
  handleUseStmt(useNode, scope, moduleName) {
    this.resolveUseStmt(useNode);
  }
  resolveUseStmt(useNode) {
    this.log("symbols", "Resolving use statement");
    this.config.services.contextTracker.pushContextSpan(useNode.span);
    try {
      if (useNode.path) {
        this.resolveModuleImport(useNode);
      } else {
        this.resolveLocalUse(useNode);
      }
      this.stats.importResolutions++;
    } catch (error) {
      this.reportError("ANALYSIS_ERROR", `Failed to resolve use statement: ${error}`, useNode.span);
    } finally {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  resolveModuleImport(useNode) {
    var _a;
    if (!this.config.program || !useNode.path) {
      this.reportError("MODULE_NOT_FOUND", "Invalid import: missing path", useNode.span);
      return;
    }
    const currentModule = this.config.program.modules.get(this.resolutionCtx.currentModule);
    const currentModulePath = (_a = currentModule == null ? void 0 : currentModule.metadata) == null ? void 0 : _a.path;
    if (!useNode.targetArr) {
      if (!useNode.alias) {
        this.reportError(
          "ANALYSIS_ERROR",
          `Wildcard import requires an alias`,
          useNode.span
        );
        return;
      }
      const symbolName2 = useNode.alias.name;
      const existingSymbol2 = this.config.services.scopeManager.getSymbolInCurrentScope(symbolName2);
      if (!existingSymbol2 || existingSymbol2.kind !== "Use") {
        return;
      }
      if (!PathUtils.validatePath(this.config.program, useNode.path, currentModulePath)) {
        return;
      }
      const resolvedPath2 = PathUtils.resolveModulePath(this.config.program, useNode.path, currentModulePath);
      const targetModuleName2 = PathUtils.findModuleNameByPath(this.config.program, resolvedPath2);
      if (!targetModuleName2) {
        this.reportError("MODULE_NOT_FOUND", `Could not resolve module name for path: ${useNode.path}`, useNode.span);
        return;
      }
      const targetModuleScope2 = this.findModuleScope(targetModuleName2);
      if (!targetModuleScope2) {
        this.reportError("MODULE_SCOPE_NOT_FOUND", `Could not find scope for module: ${targetModuleName2}`, useNode.span);
        return;
      }
      existingSymbol2.declared = true;
      existingSymbol2.type = TypeNode.asIdentifier(useNode.span, targetModuleName2);
      this.log("verbose", `Resolved wildcard import from '${targetModuleName2}' as '${symbolName2}'`);
      return;
    }
    const symbolName = useNode.alias ? useNode.alias.name : useNode.targetArr[useNode.targetArr.length - 1].name;
    const existingSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(symbolName);
    if (!existingSymbol || existingSymbol.kind !== "Use") {
      return;
    }
    if (!PathUtils.validatePath(this.config.program, useNode.path, currentModulePath)) {
      if (!existingSymbol.importSource) {
        this.reportError("MODULE_NOT_FOUND", `Module not found: ${useNode.path}`, useNode.span);
      }
      return;
    }
    const resolvedPath = PathUtils.resolveModulePath(this.config.program, useNode.path, currentModulePath);
    const targetModuleName = PathUtils.findModuleNameByPath(this.config.program, resolvedPath);
    if (!targetModuleName) {
      this.reportError("MODULE_NOT_FOUND", `Could not resolve module name for path: ${useNode.path}`, useNode.span);
      return;
    }
    const targetModuleScope = this.findModuleScope(targetModuleName);
    if (!targetModuleScope) {
      this.reportError("MODULE_SCOPE_NOT_FOUND", `Could not find scope for module: ${targetModuleName}`, useNode.span);
      return;
    }
    this.resolveModuleWithScope(useNode, targetModuleName, targetModuleScope);
  }
  resolveModuleWithScope(useNode, targetModuleName, targetModuleScope) {
    const originalScope = this.config.services.scopeManager.getCurrentScope();
    const originalContext = this.saveModuleContext();
    try {
      this.switchToTargetModule(targetModuleName, targetModuleScope);
      const targetSymbol = this.resolveImportTarget(useNode);
      if (targetSymbol) {
        this.propagateImportType(useNode, targetSymbol, originalScope);
      }
    } finally {
      this.restoreModuleContext(originalContext, originalScope);
    }
  }
  resolveLocalUse(useNode) {
    if (!useNode.targetArr) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Wildcard import only supported for module imports (use * as x from "...")`,
        useNode.span
      );
      return;
    }
    const targetName = useNode.targetArr[0].name;
    const targetSymbol = this.config.services.scopeManager.lookupSymbol(targetName);
    if (targetSymbol && !targetSymbol.declared) {
      this.reportError(
        "USED_BEFORE_DECLARED",
        `Symbol '${targetName}' used before declaration`,
        useNode.targetArr[0].span
      );
      return;
    }
    this.resolveExprStmt(this.identOrMemberAccess(useNode.targetArr));
    if (useNode.alias) {
      this.markAliasAsDeclared(useNode.alias);
    }
  }
  identOrMemberAccess(nodes) {
    if (nodes.length === 0) {
      throw new Error("Cannot create identifier expression from empty array");
    }
    const base = ExprNode.asIdent(nodes[0].span, nodes[0].name, nodes[0].builtin);
    if (nodes.length === 1) return base;
    return ExprNode.asMemberAccess(nodes[0].span, base, this.identOrMemberAccess(nodes.slice(1)));
  }
  saveModuleContext() {
    return {
      moduleName: this.config.services.contextTracker.getModuleName(),
      modulePath: this.config.services.contextTracker.getModulePath()
    };
  }
  switchToTargetModule(targetModule, targetModuleScope) {
    var _a, _b;
    this.config.services.scopeManager.setCurrentScope(targetModuleScope.id);
    this.config.services.contextTracker.setModuleName(targetModule);
    const targetModulePath = (_b = (_a = this.config.program.modules.get(targetModule)) == null ? void 0 : _a.metadata) == null ? void 0 : _b.path;
    if (targetModulePath) {
      this.config.services.contextTracker.setModulePath(targetModulePath);
    }
  }
  restoreModuleContext(originalContext, originalScope) {
    this.config.services.contextTracker.setModuleName(originalContext.moduleName);
    this.config.services.contextTracker.setModulePath(originalContext.modulePath);
    this.config.services.scopeManager.setCurrentScope(originalScope.id);
  }
  resolveImportTarget(useNode) {
    if (!useNode.targetArr) {
      if (!useNode.alias) {
        this.reportError(
          "ANALYSIS_ERROR",
          "Wildcard import requires an alias",
          useNode.span
        );
        return null;
      }
      const moduleSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(useNode.alias.name);
      if (moduleSymbol) {
        moduleSymbol.declared = true;
      }
      return moduleSymbol;
    }
    const targetName = useNode.targetArr[0].name;
    if (!targetName) return null;
    const targetSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(targetName);
    if (targetSymbol) {
      targetSymbol.declared = true;
      if (useNode.targetArr.length > 1) {
        let currentSymbol = targetSymbol;
        for (let i = 1; i < useNode.targetArr.length; i++) {
          const memberName = useNode.targetArr[i].name;
          if (!currentSymbol || !currentSymbol.type) {
            this.reportError(
              "SYMBOL_NOT_FOUND",
              `Cannot resolve member path: ${useNode.targetArr.slice(0, i + 1).map((t) => t.name).join(".")}`,
              useNode.targetArr[i].span
            );
            return null;
          }
          const memberSymbol = this.resolveMemberInType(currentSymbol.type, memberName);
          if (!memberSymbol) {
            this.reportError(
              "SYMBOL_NOT_FOUND",
              `Member '${memberName}' not found in type`,
              useNode.targetArr[i].span
            );
            return null;
          }
          currentSymbol = memberSymbol;
          currentSymbol.used = true;
        }
        return currentSymbol;
      }
      return targetSymbol;
    }
    return null;
  }
  resolveMemberInType(type, memberName) {
    var _a, _b;
    if (type.kind === "optional") {
      const optional = type.getOptional();
      return this.resolveMemberInType(optional.target, memberName);
    }
    if (type.kind === "struct") {
      const struct = type.getStruct();
      const scopeId = (_a = struct.metadata) == null ? void 0 : _a.scopeId;
      if (scopeId !== void 0) {
        const typeScope = this.config.services.scopeManager.getScope(scopeId);
        const fieldSymbol = typeScope.symbols.get(memberName);
        if (fieldSymbol && fieldSymbol.kind === "StructField") {
          return fieldSymbol;
        }
        const methodSymbol = typeScope.symbols.get(memberName);
        if (methodSymbol && methodSymbol.kind === "Function") {
          return methodSymbol;
        }
      }
      return null;
    }
    if (type.kind === "enum") {
      const enumType = type.getEnum();
      const scopeId = (_b = enumType.metadata) == null ? void 0 : _b.scopeId;
      if (scopeId !== void 0) {
        const typeScope = this.config.services.scopeManager.getScope(scopeId);
        const variantSymbol = typeScope.symbols.get(memberName);
        if (variantSymbol && variantSymbol.kind === "EnumVariant") {
          return variantSymbol;
        }
      }
      return null;
    }
    if (type.kind === "ident") {
      const ident = type.getIdent();
      const typeSymbol = this.config.services.scopeManager.lookupSymbol(ident.name);
      if (typeSymbol == null ? void 0 : typeSymbol.type) {
        return this.resolveMemberInType(typeSymbol.type, memberName);
      }
    }
    return null;
  }
  propagateImportType(useNode, targetSymbol, originalScope) {
    const importName = useNode.alias ? useNode.alias.name : useNode.targetArr ? useNode.targetArr[useNode.targetArr.length - 1].name : "<invalid>";
    if (!importName || importName === "<invalid>") return;
    const importSymbol = originalScope.symbols.get(importName);
    if (importSymbol) {
      importSymbol.type = targetSymbol.type;
      importSymbol.declared = true;
    }
  }
  markAliasAsDeclared(alias) {
    const aliasSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(alias.name);
    if (aliasSymbol) {
      aliasSymbol.declared = true;
      this.config.services.contextTracker.startDeclaration(alias.name, aliasSymbol.id, "let", alias.span, this.config.services.scopeManager.getCurrentScope().id);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.3] DEF ──────────────────────────────┐
  handleDefStmt(defNode, scope, moduleName) {
    this.resolveDefStmt(defNode);
  }
  resolveDefStmt(defNode) {
    this.log("symbols", `Resolving definition '${defNode.ident.name}'`);
    const symbol = this.config.services.scopeManager.getSymbolInCurrentScope(defNode.ident.name);
    if (!symbol) {
      this.reportError("INTERNAL_ERROR", `Definition symbol '${defNode.ident.name}' not found in current scope`, defNode.ident.span);
      return;
    }
    this.config.services.contextTracker.startDeclaration(defNode.ident.name, symbol.id, "def", defNode.span, this.config.services.scopeManager.getCurrentScope().id);
    symbol.declared = true;
    this.resolveType(defNode.type, symbol);
    this.config.services.contextTracker.completeDeclaration(symbol.id);
    this.stats.resolvedSymbols++;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.4] LET ──────────────────────────────┐
  handleLetStmt(letNode, scope, moduleName) {
    this.resolveLetStmt(letNode);
  }
  resolveLetStmt(letNode) {
    this.log("symbols", `Resolving let '${letNode.field.ident.name}'`);
    const symbol = this.config.services.scopeManager.getSymbolInCurrentScope(letNode.field.ident.name);
    if (!symbol) {
      this.reportError("INTERNAL_ERROR", `Variable symbol '${letNode.field.ident.name}' not found in current scope`, letNode.field.ident.span);
      return;
    }
    this.config.services.contextTracker.startDeclaration(letNode.field.ident.name, symbol.id, "let", letNode.field.span, this.config.services.scopeManager.getCurrentScope().id);
    if (letNode.field.initializer) {
      if (this.isConstructorExpression(letNode.field.initializer)) {
        const primary = letNode.field.initializer.getPrimary();
        const obj = primary.getObject();
        const constructorName = obj.ident.name;
        const constructorSymbol = this.config.services.scopeManager.lookupSymbol(constructorName);
        if (constructorSymbol && constructorSymbol.type) {
          const isValid = this.validateConstructorFields(obj, constructorSymbol.type);
          if (isValid) {
            symbol.type = constructorSymbol.type;
            letNode.field.type = constructorSymbol.type;
          } else {
            this.config.services.contextTracker.completeDeclaration(symbol.id);
            return;
          }
        }
      } else if (letNode.field.initializer.kind === "Primary") {
        const primary = letNode.field.initializer.getPrimary();
        if (primary && primary.kind === "Type") {
          const anonType = primary.getType();
          this.resolveType(anonType, symbol);
          symbol.type = anonType;
          letNode.field.type = anonType;
          this.stats.anonymousTypesResolved++;
        }
      }
      this.resolveVariableInitializer(letNode, symbol);
    }
    symbol.declared = true;
    if (letNode.field.type && !this.resolveType(letNode.field.type, symbol, letNode.field.span)) {
      return;
    }
    this.config.services.contextTracker.completeDeclaration(symbol.id);
    this.stats.resolvedSymbols++;
  }
  isConstructorExpression(expr) {
    if (expr.kind !== "Primary") {
      return false;
    }
    const primary = expr.getPrimary();
    if (!primary || primary.kind !== "Object") {
      return false;
    }
    const obj = primary.getObject();
    if (!obj) {
      return false;
    }
    const hasConstructorName = obj.ident !== null && obj.ident !== void 0 && typeof obj.ident.name === "string" && obj.ident.name.length > 0;
    return hasConstructorName;
  }
  validateConstructorFields(obj, type) {
    var _a;
    if (type.kind !== "struct") return true;
    const struct = type.getStruct();
    const scopeId = (_a = struct.metadata) == null ? void 0 : _a.scopeId;
    if (scopeId === void 0) {
      this.log("verbose", "Cannot validate constructor: struct has no scope");
      return true;
    }
    const typeScope = this.config.services.scopeManager.getScope(scopeId);
    const providedFields = /* @__PURE__ */ new Set();
    let hasError = false;
    for (const prop of obj.props) {
      const fieldName = prop.key.name;
      providedFields.add(fieldName);
      const fieldSymbol = typeScope.symbols.get(fieldName);
      if (!fieldSymbol || fieldSymbol.kind !== "StructField") {
        this.reportError(
          "SYMBOL_NOT_FOUND",
          `Member '${fieldName}' not found in struct`,
          prop.key.span
        );
        hasError = true;
      } else {
        if (prop.val) {
          this.resolveExprStmt(prop.val);
        }
      }
    }
    for (const [fieldName, fieldSymbol] of typeScope.symbols) {
      if (fieldSymbol.kind === "StructField") {
        const isRequired = !providedFields.has(fieldName) && !fieldSymbol.initialized;
        if (isRequired) {
          this.reportError(
            "SYMBOL_NOT_FOUND",
            `Required field '${fieldName}' not provided in constructor`,
            obj.span
          );
          hasError = true;
        }
      }
    }
    return !hasError;
  }
  resolveVariableInitializer(varNode, symbol) {
    this.config.services.contextTracker.startInitialization(symbol.id);
    this.config.services.contextTracker.enterExpression("VariableInitializer", varNode.field.initializer.span, symbol.id);
    this.resolveExprStmt(varNode.field.initializer, void 0, void 0, symbol);
    this.config.services.contextTracker.exitExpression();
    return true;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.5] FUNC ─────────────────────────────┐
  handleFuncStmt(funcNode, scope, moduleName) {
    this.resolveFuncStmt(funcNode);
  }
  resolveFuncStmt(funcNode) {
    var _a, _b;
    this.log("symbols", `Resolving function '${funcNode.ident.name}'`);
    const funcSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(funcNode.ident.name);
    if (!funcSymbol) {
      this.reportError(
        "CANNOT_INFER_TYPE",
        `Function '${funcNode.ident.name}' symbol not found`,
        funcNode.span
      );
      return;
    }
    const funcScope = this.config.services.scopeManager.findChildScopeByName(
      funcNode.ident.name,
      "Function"
      /* Function */
    );
    if (!funcScope) {
      this.reportError(
        "CANNOT_INFER_TYPE",
        `Function scope for '${funcNode.ident.name}' not found`,
        funcNode.span
      );
      return;
    }
    this.config.services.contextTracker.startDeclaration(
      funcNode.ident.name,
      funcSymbol.id,
      "fn",
      funcNode.span,
      this.config.services.scopeManager.getCurrentScope().id
    );
    funcSymbol.declared = true;
    const funcSymbolScope = this.config.services.scopeManager.getScope(funcSymbol.scope);
    const parentScope = funcSymbolScope.parent !== null ? this.config.services.scopeManager.getScope(funcSymbolScope.parent) : null;
    const isStaticMethod = (parentScope == null ? void 0 : parentScope.kind) === "Type" && ((_a = parentScope.metadata) == null ? void 0 : _a.typeKind) === "Struct" && funcNode.visibility.kind === "Static";
    const previousIsStaticMethod = this.currentIsStaticMethod;
    const previousStructScope = this.currentStructScope;
    this.currentIsStaticMethod = isStaticMethod;
    this.currentStructScope = isStaticMethod ? parentScope : null;
    const isStructMethod = (parentScope == null ? void 0 : parentScope.kind) === "Type" && ((_b = parentScope.metadata) == null ? void 0 : _b.typeKind) === "Struct" && !(funcNode.visibility.kind === "Static");
    try {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.scopeManager.withScope(funcScope.id, () => {
          if (isStructMethod) {
            this.resolveSelfParameter(funcScope, parentScope);
          }
          this.resolveParameters(funcNode.parameters);
          const paramTypes = [];
          if (isStructMethod) {
            const selfSymbol = funcScope.symbols.get("self");
            if (selfSymbol == null ? void 0 : selfSymbol.type) {
              paramTypes.push(selfSymbol.type);
            } else {
              this.reportError(
                "INTERNAL_ERROR",
                `Struct method '${funcNode.ident.name}' missing 'self' parameter`,
                funcNode.span
              );
            }
          }
          for (const param of funcNode.parameters) {
            if (param.type) {
              paramTypes.push(param.type);
            } else {
              const paramSymbol = funcScope.symbols.get(param.ident.name);
              if (paramSymbol == null ? void 0 : paramSymbol.type) {
                paramTypes.push(paramSymbol.type);
              } else {
                this.reportError(
                  "CANNOT_INFER_TYPE",
                  `Cannot infer type for parameter '${param.ident.name}'`,
                  param.span
                );
                paramTypes.push(TypeNode.asUndefined(param.span));
              }
            }
          }
          let returnType = null;
          if (funcNode.returnType) {
            const tempReturnSymbol = {
              id: -1,
              name: "<return-type>",
              kind: "Variable",
              type: null,
              scope: funcScope.id,
              contextSpan: funcNode.returnType.span,
              declared: true,
              initialized: true,
              used: false,
              isTypeChecked: false,
              visibility: { kind: "Private" },
              mutability: { kind: "Immutable" },
              isExported: false
            };
            this.resolveType(funcNode.returnType, tempReturnSymbol);
            returnType = funcNode.returnType;
          }
          if (funcNode.errorType) {
            const tempErrorSymbol = {
              id: -1,
              name: "<func-error-type>",
              kind: "Variable",
              type: null,
              scope: funcScope.id,
              contextSpan: funcNode.errorType.span,
              declared: true,
              initialized: true,
              used: false,
              isTypeChecked: false,
              visibility: { kind: "Private" },
              mutability: { kind: "Immutable" },
              isExported: false
            };
            if (!this.resolveType(funcNode.errorType, tempErrorSymbol, funcNode.span)) {
              funcSymbol.isTypeChecked = true;
              return;
            }
            if (funcNode.errorType.isIdent()) {
              const errorIdent = funcNode.errorType.getIdent();
              if (!errorIdent.builtin) {
                const errorSymbol = this.config.services.scopeManager.lookupSymbol(errorIdent.name);
                if (!errorSymbol) {
                  this.reportError(
                    "UNDEFINED_IDENTIFIER",
                    `Error type '${errorIdent.name}' is not defined`,
                    funcNode.errorType.span
                  );
                  funcSymbol.isTypeChecked = true;
                  return;
                }
                if (errorSymbol.type && !errorSymbol.type.isErrset()) {
                  this.reportError(
                    "TYPE_MISMATCH",
                    `'${errorIdent.name}' is not an error type`,
                    funcNode.errorType.span
                  );
                  funcSymbol.isTypeChecked = true;
                  return;
                }
              }
            }
          }
          funcSymbol.type = TypeNode.asFunction(
            funcNode.span,
            paramTypes,
            returnType || TypeNode.asVoid(funcNode.span),
            funcNode.errorType
          );
          if (funcNode.body) {
            this.config.services.contextTracker.enterExpression(
              "FunctionBody",
              funcNode.body.span
            );
            this.resolveStmt(funcNode.body, funcScope);
            this.config.services.contextTracker.exitExpression();
          }
        });
      });
      if (isStructMethod) {
        this.stats.structMethodsResolved++;
      }
    } finally {
      this.config.services.contextTracker.completeDeclaration(funcSymbol.id);
      this.currentIsStaticMethod = previousIsStaticMethod;
      this.currentStructScope = previousStructScope;
    }
    funcSymbol.isTypeChecked = true;
    this.stats.resolvedSymbols++;
  }
  resolveSelfParameter(funcScope, structScope) {
    const selfSymbol = funcScope.symbols.get("self");
    if (!selfSymbol) {
      this.log("verbose", `Warning: Expected 'self' parameter in struct method but not found`);
      return;
    }
    selfSymbol.declared = true;
    if (selfSymbol.type) {
      if (selfSymbol.type.kind === "ident") {
        const typeIdent = selfSymbol.type.getIdent();
        if (typeIdent.name !== structScope.name) {
          this.reportError(
            "TYPE_MISMATCH",
            `Self type mismatch: expected '${structScope.name}', got '${typeIdent.name}'`,
            selfSymbol.contextSpan
          );
        }
      }
    }
    this.log("symbols", `Resolved 'self' parameter in struct method`);
  }
  // ───── PARAMS ─────
  resolveParameters(parameters) {
    const fieldInfo = parameters.map((param, index) => ({ name: param.ident.name, index }));
    for (let i = 0; i < parameters.length; i++) {
      this.resolveParameter(parameters[i], i, fieldInfo);
    }
  }
  resolveParameter(param, index, fieldInfo) {
    const paramSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(param.ident.name);
    if (!paramSymbol) return;
    this.config.services.contextTracker.startDeclaration(param.ident.name, paramSymbol.id, "Param", param.span, this.config.services.scopeManager.getCurrentScope().id);
    paramSymbol.declared = true;
    if (param.type) {
      this.resolveType(param.type, paramSymbol);
    }
    if (param.initializer) {
      this.resolveParameterInitializer(param, index, fieldInfo);
    }
    this.config.services.contextTracker.completeDeclaration(paramSymbol.id);
    this.stats.resolvedSymbols++;
  }
  resolveParameterInitializer(param, currentFieldIndex, fieldInfo) {
    const paramSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(param.ident.name);
    this.config.services.contextTracker.startInitialization(paramSymbol.id);
    this.config.services.contextTracker.enterExpression("ParameterInitializer", param.initializer.span, paramSymbol.id);
    const parameterContext = { currentFieldIndex, parameters: fieldInfo };
    this.resolveExprStmt(param.initializer, param.span, parameterContext, paramSymbol);
    this.config.services.contextTracker.exitExpression();
  }
  // ───── FIELDS ─────
  resolveFields(fields) {
    const fieldInfo = fields.map((field, index) => ({ name: field.ident.name, index }));
    for (let i = 0; i < fields.length; i++) {
      this.resolveField(fields[i], i, fieldInfo);
    }
  }
  resolveField(field, index, fieldInfo) {
    const fieldSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(field.ident.name);
    if (!fieldSymbol) return;
    this.config.services.contextTracker.startDeclaration(field.ident.name, fieldSymbol.id, "Param", field.span, this.config.services.scopeManager.getCurrentScope().id);
    fieldSymbol.declared = true;
    if (field.type) {
      this.resolveType(field.type, fieldSymbol);
    }
    if (field.initializer) {
      this.resolveFieldInitializer(field, index, fieldInfo);
    }
    this.config.services.contextTracker.completeDeclaration(fieldSymbol.id);
    this.stats.resolvedSymbols++;
  }
  resolveFieldInitializer(field, currentFieldIndex, fieldInfo) {
    const fieldSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(field.ident.name);
    this.config.services.contextTracker.startInitialization(fieldSymbol.id);
    this.config.services.contextTracker.enterExpression("ParameterInitializer", field.initializer.span, fieldSymbol.id);
    const fieldContext = { currentFieldIndex, parameters: fieldInfo };
    this.resolveExprStmt(field.initializer, field.span, fieldContext, fieldSymbol);
    this.config.services.contextTracker.exitExpression();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.6] LOOP ─────────────────────────────┐
  handleLoopStmt(stmt, scope, moduleName) {
    if (stmt.getLoop === void 0) {
      const data = stmt;
      switch (stmt.kind) {
        case "While": {
          const src = data.source;
          const loop = LoopStmtNode.createWhile(data.span, src.expr, src.stmt);
          this.resolveLoopStmt(loop);
          break;
        }
        case "Do": {
          const src = data.source;
          const loop = LoopStmtNode.createDo(data.span, src.expr, src.stmt);
          this.resolveLoopStmt(loop);
          break;
        }
        case "For": {
          const src = data.source;
          const loop = LoopStmtNode.createFor(data.span, src.expr, src.stmt);
          this.resolveLoopStmt(loop);
          break;
        }
      }
    } else {
      this.resolveLoopStmt(stmt.getLoop());
    }
  }
  resolveLoopStmt(loopStmt) {
    this.log("symbols", "Resolving loop statement");
    const loopScope = this.config.services.scopeManager.findChildScopeByName(
      "loop",
      "Loop"
      /* Loop */
    );
    if (loopScope) {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.contextTracker.setScope(loopScope.id);
        this.config.services.scopeManager.withScope(loopScope.id, () => {
          if (loopStmt.kind === "While") {
            if (loopStmt.expr) this.resolveExprStmt(loopStmt.expr);
            if (loopStmt.stmt) this.resolveStmt(loopStmt.stmt, loopScope);
          } else if (loopStmt.kind === "Do") {
            if (loopStmt.stmt) this.resolveStmt(loopStmt.stmt, loopScope);
            if (loopStmt.expr) this.resolveExprStmt(loopStmt.expr);
          } else if (loopStmt.kind === "For") {
            if (loopStmt.expr) this.resolveExprStmt(loopStmt.expr);
            if (loopStmt.stmt) this.resolveStmt(loopStmt.stmt, loopScope);
          }
        });
      });
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────── [3.7] CTRLFLOW ──────────────────────────┐
  handleControlflowStmt(stmt, scope, moduleName) {
    if (stmt.getCtrlflow === void 0) {
      const data = stmt;
      switch (stmt.kind) {
        case "Return": {
          const src = data.source;
          const res = ControlFlowStmtNode.asReturn(data.span, src.value);
          this.resolveReturnStmt(res);
          break;
        }
        case "Defer": {
          const src = data.source;
          const res = ControlFlowStmtNode.asDefer(data.span, src.value);
          this.resolveDeferStmt(res);
          break;
        }
        case "Throw": {
          const src = data.source;
          const res = ControlFlowStmtNode.asThrow(data.span, src.value);
          this.resolveThrowStmt(res);
          break;
        }
      }
    } else {
      switch (stmt.getCtrlflow().kind) {
        case "return": {
          this.resolveReturnStmt(stmt.getCtrlflow());
          break;
        }
        case "defer": {
          this.resolveDeferStmt(stmt.getCtrlflow());
          break;
        }
        case "throw": {
          this.resolveThrowStmt(stmt.getCtrlflow());
          break;
        }
      }
    }
  }
  resolveReturnStmt(returnNode) {
    this.log("symbols", "Resolving return statement");
    if (returnNode.value) {
      this.config.services.contextTracker.enterExpression("ReturnExpression", returnNode.value.span);
      this.resolveExprStmt(returnNode.value);
      this.config.services.contextTracker.exitExpression();
    }
  }
  resolveDeferStmt(deferNode) {
    this.log("symbols", "Resolving defer statement");
    if (deferNode.value) {
      this.config.services.contextTracker.enterExpression("DeferExpression", deferNode.value.span);
      this.resolveExprStmt(deferNode.value);
      this.config.services.contextTracker.exitExpression();
    }
  }
  resolveThrowStmt(throwNode) {
    this.log("symbols", "Resolving throw statement");
    if (throwNode.value) {
      this.config.services.contextTracker.enterExpression("ThrowExpression", throwNode.value.span);
      this.resolveExprStmt(throwNode.value);
      this.config.services.contextTracker.exitExpression();
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [4] EXPR Level ───────────────────────────┐
  resolveExprStmt(expr, contextSpan, parameterContext, symbol) {
    if (!expr) return;
    this.log("symbols", `Resolving expression of type ${expr.kind}`);
    this.config.services.contextTracker.pushContextSpan(expr.span);
    try {
      switch (expr.kind) {
        case "Primary":
          this.resolvePrimary(expr.getPrimary(), contextSpan, parameterContext, symbol);
          break;
        case "Binary":
          this.resolveBinary(expr.getBinary(), contextSpan, parameterContext);
          break;
        case "Prefix":
          this.resolvePrefix(expr.getPrefix(), contextSpan, parameterContext);
          break;
        case "Postfix":
          this.resolvePostfix(expr.getPostfix(), contextSpan, parameterContext);
          break;
        case "As":
          this.resolveAs(expr.getAs(), contextSpan, parameterContext);
          break;
        case "Typeof":
          return this.resolveExprStmt(expr.getTypeof().expr, contextSpan, parameterContext);
        case "Sizeof":
          return this.resolveExprStmt(expr.getSizeof().expr, contextSpan, parameterContext);
        case "Orelse":
          this.resolveOrelse(expr.getOrelse(), contextSpan, parameterContext);
          break;
        case "Range":
          this.resolveRange(expr.getRange(), contextSpan, parameterContext);
          break;
        case "Try":
          this.resolveTry(expr.getTry(), contextSpan, parameterContext);
          break;
        case "Catch":
          this.resolveCatch(expr.getCatch(), contextSpan, parameterContext);
          break;
        case "If":
          this.resolveIf(expr.getIf(), contextSpan, parameterContext);
          break;
        case "Switch":
          this.resolveSwitch(expr.getSwitch(), contextSpan, parameterContext);
          break;
        default:
          this.log("verbose", `Unhandled expression type: ${expr.kind}`);
          break;
      }
    } finally {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  resolvePrimary(primary, contextSpan, fieldContext, symbol) {
    var _a, _b, _c, _d;
    switch (primary.kind) {
      case "Ident":
        this.resolveIdentifier(primary.getIdent(), contextSpan, fieldContext);
        break;
      case "Paren": {
        const paren = primary.getParen();
        if (paren.source) {
          this.resolveExprStmt(paren.source, contextSpan, fieldContext, symbol);
        }
        break;
      }
      case "Literal":
        break;
      case "Tuple":
        this.resolveTuple(primary.getTuple(), contextSpan, fieldContext);
        break;
      case "Object":
        this.resolveObject(primary.getObject(), contextSpan, fieldContext);
        break;
      case "Type": {
        const type = primary.getType();
        const tempSymbol = {
          id: -1,
          name: (_d = (_c = (_a = symbol == null ? void 0 : symbol.name) != null ? _a : fieldContext == null ? void 0 : fieldContext.parameters[fieldContext == null ? void 0 : fieldContext.currentFieldIndex].name) != null ? _c : (_b = type.getIdent()) == null ? void 0 : _b.name) != null ? _d : "<type-expr>",
          kind: "Variable",
          type: null,
          scope: this.config.services.scopeManager.getCurrentScope().id,
          contextSpan: type.span,
          declared: true,
          initialized: true,
          used: false,
          isTypeChecked: false,
          visibility: { kind: "Private" },
          mutability: { kind: "Immutable" },
          isExported: false
        };
        this.resolveType(type, tempSymbol, contextSpan);
        break;
      }
      default:
        this.log("verbose", `Unhandled primary type: ${primary.kind}`);
        break;
    }
  }
  resolveTuple(tuple, contextSpan, parameterContext) {
    for (const field of tuple.fields) {
      this.resolveExprStmt(field, contextSpan, parameterContext);
    }
  }
  resolveObject(obj, contextSpan, parameterContext) {
    if (obj.ident) this.resolveIdentifier(obj.ident, contextSpan, parameterContext);
    for (const prop of obj.props) {
      if (prop.val) {
        this.resolveExprStmt(prop.val, contextSpan, parameterContext);
      }
    }
  }
  resolveBinary(binary, contextSpan, parameterContext) {
    if (binary.left) {
      this.resolveExprStmt(binary.left, contextSpan, parameterContext);
    }
    if (binary.right) {
      this.resolveExprStmt(binary.right, contextSpan, parameterContext);
    }
  }
  resolvePrefix(prefix, contextSpan, parameterContext) {
    if (prefix.expr) {
      this.resolveExprStmt(prefix.expr, contextSpan, parameterContext);
    }
  }
  resolvePostfix(postfix, contextSpan, parameterContext) {
    switch (postfix.kind) {
      case "Call":
        this.resolvePostfixCall(postfix.getCall(), contextSpan, parameterContext);
        break;
      case "ArrayAccess":
        this.resolvePostfixArrayAccess(postfix.getArrayAccess(), contextSpan, parameterContext);
        break;
      case "MemberAccess":
        this.resolvePostfixMemberAccess(postfix.getMemberAccess(), contextSpan, parameterContext);
        break;
      case "Increment":
      case "Decrement":
      case "Dereference":
        this.resolveExprStmt(postfix.getAsExprNode(), contextSpan, parameterContext);
        break;
      default:
        this.log("verbose", `Unhandled postfix type: ${postfix.kind}`);
        break;
    }
  }
  resolvePostfixCall(call, contextSpan, parameterContext) {
    this.log("symbols", "Resolving call expression");
    this.config.services.contextTracker.enterExpression("FunctionCall", call.span);
    try {
      this.resolveExprStmt(call.base, call.span, parameterContext);
      const baseSymbol = this.findCallTargetSymbol(call.base);
      if (baseSymbol) {
        this.validateCallableSymbol(baseSymbol, call.base.span);
        baseSymbol.used = true;
        this.log("symbols", `Marked function '${baseSymbol.name}' as used`);
      }
      for (let i = 0; i < call.args.length; i++) {
        const arg = call.args[i];
        this.config.services.contextTracker.enterExpression("CallArgument", arg.span);
        try {
          this.resolveExprStmt(arg, arg.span, parameterContext);
        } finally {
          this.config.services.contextTracker.exitExpression();
        }
      }
    } finally {
      this.config.services.contextTracker.exitExpression();
    }
  }
  resolvePostfixArrayAccess(arrayAccess, contextSpan, parameterContext) {
    this.log("symbols", "Resolving array access");
    this.resolveExprStmt(arrayAccess.base, contextSpan, parameterContext);
    this.resolveExprStmt(arrayAccess.index, contextSpan, parameterContext);
  }
  resolvePostfixMemberAccess(memberAccess, contextSpan, parameterContext) {
    this.log("symbols", "Resolving member access");
    if (memberAccess.base.is("Primary")) {
      const primary = memberAccess.base.getPrimary();
      if (primary == null ? void 0 : primary.is("Ident")) {
        const ident = primary.getIdent();
        if ((ident == null ? void 0 : ident.name) === "self") {
          this.resolveExprStmt(memberAccess.target, contextSpan, parameterContext);
          this.stats.memberAccessResolved++;
          return;
        }
      }
    }
    this.resolveExprStmt(memberAccess.base, contextSpan, parameterContext);
    const baseSymbol = this.findMemberAccessBaseSymbol(memberAccess.base);
    if (!baseSymbol) {
      if (memberAccess.base.is("Primary")) {
        const primary = memberAccess.base.getPrimary();
        if (primary == null ? void 0 : primary.is("Ident")) {
          const ident = primary.getIdent();
          if ((ident == null ? void 0 : ident.name) === "self" && this.currentIsStaticMethod) {
            this.stats.memberAccessResolved++;
            return;
          }
        }
      }
      this.reportError(
        "TYPE_INFERENCE_FAILED",
        `Cannot resolve base for member access`,
        memberAccess.base.span
      );
      return;
    }
    this.stats.memberAccessResolved++;
  }
  findMemberAccessBaseSymbol(baseExpr) {
    if (baseExpr.kind === "Primary") {
      const primary = baseExpr.getPrimary();
      if (primary && primary.kind === "Ident") {
        const ident = primary.getIdent();
        if (ident) {
          return this.config.services.scopeManager.lookupSymbol(ident.name);
        }
      }
    }
    if (baseExpr.kind === "Postfix") {
      const postfix = baseExpr.getPostfix();
      if (!postfix) return null;
      if (postfix.kind === "Dereference") {
        const derefExpr = postfix.getAsExprNode();
        if (derefExpr) {
          return this.findMemberAccessBaseSymbol(derefExpr);
        }
      }
      if (postfix.kind === "MemberAccess") {
        const member = postfix.getMemberAccess();
        return this.findMemberAccessBaseSymbol(member.base);
      }
    }
    return null;
  }
  resolveSelfMemberAccess(memberAccess, selfSymbol) {
    let currentScope = this.config.services.scopeManager.getCurrentScope();
    while (currentScope && currentScope.kind !== "Function") {
      const parent = this.config.services.scopeManager.getScopeParent(currentScope.id);
      if (!parent) break;
      currentScope = parent;
    }
    if (!currentScope || currentScope.kind !== "Function") {
      this.reportError("UNDEFINED_IDENTIFIER", "Cannot use 'self' outside of method context", memberAccess.span);
      return;
    }
    const parentScope = this.config.services.scopeManager.getScopeParent(currentScope.id);
    if (!parentScope || parentScope.kind !== "Type") {
      this.reportError("UNDEFINED_IDENTIFIER", "Cannot use 'self' outside of struct method", memberAccess.span);
      return;
    }
    if (memberAccess.target.isIdent()) {
      const memberIdent = memberAccess.target.getIdent();
      const memberSymbol = parentScope.symbols.get(memberIdent.name);
      if (!memberSymbol) {
        this.reportError(
          "SYMBOL_NOT_FOUND",
          `Member '${memberIdent.name}' not found in struct '${parentScope.name}'`,
          memberIdent.span
        );
        return;
      }
      if (memberSymbol.kind !== "StructField") {
        this.reportError(
          "SYMBOL_NOT_FOUND",
          `'${memberIdent.name}' is not a field`,
          memberIdent.span
        );
        return;
      }
      memberSymbol.used = true;
      this.log("symbols", `Resolved self.${memberIdent.name} in struct method`);
    }
  }
  resolveAs(asNode, contextSpan, parameterContext) {
    this.resolveExprStmt(asNode.base, contextSpan, parameterContext);
    const tempSymbol = {
      id: -1,
      name: "<as-expr>",
      kind: "Variable",
      type: null,
      scope: this.config.services.scopeManager.getCurrentScope().id,
      contextSpan: asNode.span,
      declared: true,
      initialized: true,
      used: false,
      isTypeChecked: false,
      visibility: { kind: "Private" },
      mutability: { kind: "Immutable" },
      isExported: false
    };
    this.resolveType(asNode.type, tempSymbol, contextSpan);
  }
  resolveOrelse(orelse, contextSpan, parameterContext) {
    this.resolveExprStmt(orelse.left, contextSpan, parameterContext);
    this.resolveExprStmt(orelse.right, contextSpan, parameterContext);
  }
  resolveRange(range, contextSpan, parameterContext) {
    if (range.leftExpr) this.resolveExprStmt(range.leftExpr, contextSpan, parameterContext);
    if (range.rightExpr) this.resolveExprStmt(range.rightExpr, contextSpan, parameterContext);
  }
  resolveTry(tryNode, contextSpan, parameterContext) {
    this.resolveExprStmt(tryNode.expr, contextSpan, parameterContext);
  }
  resolveCatch(catchNode, contextSpan, parameterContext) {
    this.resolveExprStmt(catchNode.leftExpr, contextSpan, parameterContext);
    const exprScope = this.config.services.scopeManager.findChildScopeByName(
      "expr",
      "Expression"
      /* Expression */
    );
    if (exprScope) {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.contextTracker.setScope(exprScope.id);
        this.config.services.scopeManager.withScope(exprScope.id, () => {
          this.resolveStmt(catchNode.rightStmt, exprScope);
        });
      });
    } else {
      this.resolveStmt(catchNode.rightStmt, this.config.services.scopeManager.getCurrentScope());
    }
  }
  resolveIf(ifNode, contextSpan, parameterContext) {
    this.config.services.contextTracker.enterExpression("ConditionExpression", ifNode.condExpr.span);
    this.resolveExprStmt(ifNode.condExpr, contextSpan, parameterContext);
    this.config.services.contextTracker.exitExpression();
    const currentScope = this.config.services.scopeManager.getCurrentScope();
    this.resolveStmt(ifNode.thenStmt, currentScope);
    if (ifNode.elseStmt) {
      this.resolveStmt(ifNode.elseStmt, currentScope);
    }
  }
  resolveSwitch(switchNode, contextSpan, parameterContext) {
    this.config.services.contextTracker.enterExpression("ConditionExpression", switchNode.condExpr.span);
    this.resolveExprStmt(switchNode.condExpr, contextSpan, parameterContext);
    this.config.services.contextTracker.exitExpression();
    const currentScope = this.config.services.scopeManager.getCurrentScope();
    for (const switchCase of switchNode.cases) {
      if (switchCase.expr) {
        this.resolveExprStmt(switchCase.expr, contextSpan, parameterContext);
      }
      if (switchCase.stmt) {
        this.resolveStmt(switchCase.stmt, currentScope);
      }
    }
    if (switchNode.defCase) {
      this.resolveStmt(switchNode.defCase.stmt, currentScope);
    }
  }
  findCallTargetSymbol(baseExpr) {
    if (baseExpr.kind === "Primary") {
      const primary = baseExpr.getPrimary();
      if (primary && primary.kind === "Ident") {
        const ident = primary.getIdent();
        if (ident) {
          return this.config.services.scopeManager.lookupSymbol(ident.name);
        }
      }
    }
    return null;
  }
  validateCallableSymbol(symbol, span) {
    var _a, _b, _c, _d, _e;
    if (symbol.kind === "Function" || ((_a = symbol.metadata) == null ? void 0 : _a.callable) === true) {
      return;
    }
    if (((_b = symbol.type) == null ? void 0 : _b.kind) === "function") {
      return;
    }
    if (symbol.kind === "Use" && symbol.importSource) {
      const sourceModuleScope = this.config.services.scopeManager.findScopeByName(
        symbol.importSource,
        "Module"
        /* Module */
      );
      if (sourceModuleScope) {
        let sourceSymbol = sourceModuleScope.symbols.get(symbol.name);
        if (!sourceSymbol) {
          for (const [_, potentialSource] of sourceModuleScope.symbols) {
            if (potentialSource.kind === "Function" || ((_c = potentialSource.metadata) == null ? void 0 : _c.callable) === true) {
              sourceSymbol = potentialSource;
              break;
            }
          }
        }
        if (sourceSymbol) {
          if (sourceSymbol.kind === "Function" || ((_d = sourceSymbol.metadata) == null ? void 0 : _d.callable) === true || ((_e = sourceSymbol.type) == null ? void 0 : _e.kind) === "function") {
            return;
          }
        }
      }
    }
    this.reportError(
      "NOT_A_FUNCTION",
      `Cannot call value of non-function type. '${symbol.name}' is a ${symbol.kind.toLowerCase()}`,
      span
    );
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [5] Ident Level ──────────────────────────┐
  resolveIdentifier(ident, contextSpan, parameterContext) {
    var _a;
    this.log("symbols", `Resolving identifier '${ident.name}'`);
    this.config.services.contextTracker.pushContextSpan(ident.span);
    try {
      if (parameterContext) {
        if (this.checkParameterForwardReference(ident, parameterContext)) {
          return;
        }
      }
      if (this.checkSelfReference(ident)) {
        return;
      }
      if (ident.builtin) {
        this.resolveBuiltinFunction(ident);
        return;
      }
      if (ident.name === "self") {
        if (this.currentIsStaticMethod && this.currentStructScope) {
          this.stats.resolvedSymbols++;
          this.config.services.contextTracker.popContextSpan();
          return;
        }
        const selfSymbol = this.config.services.scopeManager.lookupSymbol("self");
        if (selfSymbol && ((_a = selfSymbol.metadata) == null ? void 0 : _a.isSelf)) {
          selfSymbol.used = true;
          this.stats.resolvedSymbols++;
          this.config.services.contextTracker.popContextSpan();
          return;
        }
        this.reportError(
          "UNDEFINED_IDENTIFIER",
          "self can only be used in non-static struct methods",
          ident.span
        );
        this.config.services.contextTracker.popContextSpan();
        return;
      }
      if (this.currentIsStaticMethod && this.currentStructScope) {
        const fieldSymbol = this.currentStructScope.symbols.get(ident.name);
        if (fieldSymbol && fieldSymbol.kind === "StructField") {
          const isStaticField = fieldSymbol.visibility.kind === "Static";
          if (!isStaticField) {
            this.reportError(
              "INVALID_STATIC_ACCESS",
              `Cannot access instance field '${ident.name}' in static method. Static methods can only access static fields.`,
              ident.span
            );
            return;
          }
        }
      }
      const currentScope = this.config.services.scopeManager.getCurrentScope();
      if (currentScope.kind === "Function") {
        const parentScope = this.config.services.scopeManager.getScopeParent(currentScope.id);
        if (parentScope && parentScope.kind === "Type") {
          const fieldSymbol = parentScope.symbols.get(ident.name);
          if (fieldSymbol && fieldSymbol.kind === "StructField") {
            fieldSymbol.used = true;
            this.stats.resolvedSymbols++;
            this.log("symbols", `Resolved struct field '${fieldSymbol.name}' as used`);
            this.config.services.contextTracker.popContextSpan();
            return;
          }
        }
      }
      this.resolveStandardIdentifier(ident, contextSpan);
    } finally {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  resolveBuiltinFunction(ident) {
    const globalScope = this.config.services.scopeManager.getAllScopes().find(
      (s) => s.kind === "Global"
      /* Global */
    );
    if (!globalScope) {
      throw new Error("Global scope not found");
    }
    const builtinName = `@${ident.name}`;
    const builtinSymbol = globalScope.symbols.get(builtinName);
    if (!builtinSymbol) {
      this.reportError(
        "UNDEFINED_BUILTIN",
        `Undefined builtin function '${builtinName}'`,
        ident.span
      );
      return;
    }
    builtinSymbol.used = true;
    this.stats.resolvedSymbols++;
  }
  resolveStandardIdentifier(ident, contextSpan) {
    this.log("symbols", `Resolving standard identifier '${ident.name}'`);
    const cacheKey = this.createCacheKey(ident);
    let symbol = this.resolutionCtx.cache.get(cacheKey);
    if (symbol !== void 0) {
      this.stats.cachedResolutions++;
      if (symbol) {
        symbol.used = true;
        this.log("symbols", `Used cached symbol '${symbol.name}'`);
      }
      return;
    }
    symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
    this.resolutionCtx.cache.set(cacheKey, symbol || null);
    if (!symbol) {
      this.config.services.contextTracker.recordPendingReference(ident.name, ident.span);
      this.reportError(
        "UNDEFINED_IDENTIFIER",
        `Undefined identifier '${ident.name}'`,
        ident.span
      );
      return;
    }
    this.validateSymbolUsage(symbol, ident, contextSpan);
    symbol.used = true;
    this.config.services.contextTracker.resolvePendingReferences(ident.name);
    this.stats.resolvedSymbols++;
    this.log("symbols", `Resolved and marked '${symbol.name}' as used`);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [6] Type Level ───────────────────────────┐
  resolveType(typeNode, symbol, contextSpan) {
    var _a, _b;
    this.log("symbols", `Resolving type for symbol '${symbol.name}', typeNode: ${typeNode.toString()}`);
    switch (typeNode.kind) {
      case "ident": {
        const identNode = typeNode.getIdent();
        if (!identNode.builtin) {
          const typeSymbol = this.config.services.scopeManager.lookupSymbol(identNode.name);
          if (!typeSymbol) {
            this.reportError(
              "UNDEFINED_IDENTIFIER",
              `Undefined type '${identNode.name}'`,
              identNode.span
            );
            return false;
          }
          if (!typeSymbol.declared) {
            this.reportError(
              "USED_BEFORE_DECLARED",
              `Symbol '${identNode.name}' used before declaration`,
              identNode.span
            );
            return false;
          }
          typeSymbol.used = true;
        }
        symbol.type = typeNode;
        return true;
      }
      case "optional": {
        const optional = typeNode.getOptional();
        if (!this.resolveType(optional.target, symbol, contextSpan)) return false;
        symbol.type = typeNode;
        return true;
      }
      case "pointer": {
        const pointer = typeNode.getPointer();
        if (pointer.target.isIdent()) {
          const targetIdent = pointer.target.getIdent();
          if (!targetIdent.builtin) {
            const targetSymbol = this.config.services.scopeManager.lookupSymbol(targetIdent.name);
            if (targetSymbol && (targetSymbol.kind === "Variable" || targetSymbol.kind === "Parameter")) {
              this.reportError(
                "TYPE_MISMATCH",
                `Cannot use pointer syntax with variable '${targetIdent.name}'. Did you mean to dereference using '.*' postfix operator?`,
                typeNode.span
              );
              return false;
            }
          }
        }
        if (!this.resolveType(pointer.target, symbol, contextSpan)) return false;
        symbol.type = typeNode;
        return true;
      }
      case "array": {
        const array = typeNode.getArray();
        if (!this.resolveType(array.target, symbol, contextSpan)) return false;
        if (array.size) this.resolveExprStmt(array.size, contextSpan, void 0, symbol);
        symbol.type = typeNode;
        return true;
      }
      case "tuple": {
        const tuple = typeNode.getTuple();
        for (const field of tuple.fields) {
          if (!this.resolveType(field, symbol, contextSpan)) return false;
        }
        symbol.type = typeNode;
        return true;
      }
      case "struct": {
        const struct = typeNode.getStruct();
        let typeScope = null;
        if (((_a = struct.metadata) == null ? void 0 : _a.scopeId) !== void 0) {
          try {
            typeScope = this.config.services.scopeManager.getScope(struct.metadata.scopeId);
          } catch (e) {
            typeScope = null;
          }
        }
        if (!typeScope && struct.name && struct.name !== "Anonymous") {
          typeScope = this.config.services.scopeManager.findChildScopeByName(
            struct.name,
            "Type"
            /* Type */
          );
        }
        if (!typeScope) {
          typeScope = this.config.services.scopeManager.findChildScopeByNameFromId(
            symbol.name,
            symbol.scope,
            "Type"
            /* Type */
          );
        }
        if (!typeScope) {
          const parentScope = this.config.services.scopeManager.getScope(symbol.scope);
          for (const childId of parentScope.children) {
            const child = this.config.services.scopeManager.getScope(childId);
            if (child.kind === "Type") {
              if (this.scopeMatchesStruct(child, struct)) {
                typeScope = child;
                break;
              }
            }
          }
        }
        if (typeScope) {
          this.config.services.contextTracker.withSavedState(() => {
            this.config.services.contextTracker.setScope(typeScope.id);
            this.config.services.scopeManager.withScope(typeScope.id, () => {
              const fields = [];
              const methods = [];
              for (const member of struct.members) {
                if (member.isField()) {
                  fields.push(member.getField());
                } else if (member.isMethod()) {
                  methods.push(member.getMethod());
                }
              }
              this.resolveFields(fields);
              for (const m of methods) {
                this.resolveFuncStmt(m);
              }
            });
          });
        } else {
          this.reportError(
            "INTERNAL_ERROR",
            `Cannot find type scope for struct '${struct.name || "<anonymous>"}'`,
            typeNode.span
          );
          return false;
        }
        symbol.type = typeNode;
        return true;
      }
      case "enum": {
        const enumType = typeNode.getEnum();
        let typeScope = null;
        if (((_b = enumType.metadata) == null ? void 0 : _b.scopeId) !== void 0) {
          try {
            typeScope = this.config.services.scopeManager.getScope(enumType.metadata.scopeId);
          } catch (e) {
            typeScope = null;
          }
        }
        if (!typeScope && symbol.name) {
          typeScope = this.config.services.scopeManager.findChildScopeByName(
            symbol.name,
            "Type"
            /* Type */
          );
        }
        if (typeScope) {
          enumType.metadata = __spreadProps(__spreadValues2({}, enumType.metadata), { scopeId: typeScope.id });
          this.config.services.contextTracker.withSavedState(() => {
            this.config.services.contextTracker.setScope(typeScope.id);
            this.config.services.scopeManager.withScope(typeScope.id, () => {
              var _a2;
              for (const variant of enumType.variants) {
                const variantSymbol = typeScope.symbols.get(variant.ident.name);
                if (variantSymbol) {
                  variantSymbol.declared = true;
                  variantSymbol.used = true;
                  this.stats.enumVariantsResolved++;
                }
                if (variant.type) {
                  if (variant.type.isStruct()) {
                    const structType = variant.type.getStruct();
                    let variantScope = null;
                    if (((_a2 = structType.metadata) == null ? void 0 : _a2.scopeId) !== void 0) {
                      try {
                        variantScope = this.config.services.scopeManager.getScope(structType.metadata.scopeId);
                      } catch (e) {
                        variantScope = null;
                      }
                    }
                    if (!variantScope) {
                      variantScope = this.config.services.scopeManager.findChildScopeByNameFromId(
                        variant.ident.name,
                        typeScope.id,
                        "Type"
                        /* Type */
                      );
                    }
                    if (variantScope) {
                      this.config.services.contextTracker.withSavedState(() => {
                        this.config.services.scopeManager.withScope(variantScope.id, () => {
                          const tempSymbol = {
                            id: -1,
                            name: variant.ident.name,
                            kind: "EnumVariant",
                            type: variant.type,
                            scope: variantScope.id,
                            contextSpan: variant.type.span,
                            declared: true,
                            initialized: true,
                            used: false,
                            isTypeChecked: false,
                            visibility: { kind: "Public" },
                            mutability: { kind: "Immutable" },
                            isExported: false
                          };
                          this.resolveType(variant.type, tempSymbol, contextSpan);
                        });
                      });
                    }
                  } else {
                    this.resolveType(variant.type, symbol, contextSpan);
                  }
                }
              }
            });
          });
        }
        symbol.type = typeNode;
        return true;
      }
      case "errset":
        const errorType = typeNode.getError();
        for (const errorMember of errorType.members) {
          const errorSymbol = this.config.services.scopeManager.lookupSymbol(errorMember.name);
          if (errorSymbol) {
            errorSymbol.used = true;
            errorSymbol.declared = true;
          }
          this.log("symbols", `Resolved error member '${errorMember.name}'`);
        }
        symbol.type = typeNode;
        return true;
      case "function": {
        const func = typeNode.getFunction();
        for (const param of func.params) {
          const tempParamSymbol = {
            id: -1,
            name: "<func-param-type>",
            kind: "Variable",
            type: null,
            scope: this.config.services.scopeManager.getCurrentScope().id,
            contextSpan: param.span,
            declared: true,
            initialized: true,
            used: false,
            isTypeChecked: false,
            visibility: { kind: "Private" },
            mutability: { kind: "Immutable" },
            isExported: false
          };
          if (!this.resolveType(param, tempParamSymbol, contextSpan)) return false;
        }
        if (func.returnType) {
          const tempReturnSymbol = {
            id: -1,
            name: "<func-return-type>",
            kind: "Variable",
            type: null,
            scope: this.config.services.scopeManager.getCurrentScope().id,
            contextSpan: func.returnType.span,
            declared: true,
            initialized: true,
            used: false,
            isTypeChecked: false,
            visibility: { kind: "Private" },
            mutability: { kind: "Immutable" },
            isExported: false
          };
          if (!this.resolveType(func.returnType, tempReturnSymbol, contextSpan)) return false;
        }
        if (func.errorType) {
          const tempErrorSymbol = {
            id: -1,
            name: "<func-error-type>",
            kind: "Variable",
            type: null,
            scope: this.config.services.scopeManager.getCurrentScope().id,
            contextSpan: func.errorType.span,
            declared: true,
            initialized: true,
            used: false,
            isTypeChecked: false,
            visibility: { kind: "Private" },
            mutability: { kind: "Immutable" },
            isExported: false
          };
          if (!this.resolveType(func.errorType, tempErrorSymbol, contextSpan)) return false;
          if (func.errorType.isIdent()) {
            const errorIdent = func.errorType.getIdent();
            if (!errorIdent.builtin) {
              const errorSymbol = this.config.services.scopeManager.lookupSymbol(errorIdent.name);
              if (!errorSymbol) {
                this.reportError(
                  "UNDEFINED_IDENTIFIER",
                  `Error type '${errorIdent.name}' is not defined`,
                  func.errorType.span
                );
                return false;
              }
              if (errorSymbol.type && !errorSymbol.type.isErrset()) {
                this.reportError(
                  "TYPE_MISMATCH",
                  `'${errorIdent.name}' is not an error type`,
                  func.errorType.span
                );
                return false;
              }
            }
          }
        }
        symbol.type = typeNode;
        return true;
      }
      case "union": {
        const union = typeNode.getUnion();
        for (const variantType of union.types) {
          const tempVariantSymbol = {
            id: -1,
            name: "<union-variant>",
            kind: "Variable",
            type: null,
            scope: this.config.services.scopeManager.getCurrentScope().id,
            contextSpan: variantType.span,
            declared: true,
            initialized: true,
            used: false,
            isTypeChecked: false,
            visibility: { kind: "Private" },
            mutability: { kind: "Immutable" },
            isExported: false
          };
          if (!this.resolveType(variantType, tempVariantSymbol, contextSpan)) return false;
        }
        symbol.type = typeNode;
        return true;
      }
      case "paren": {
        return this.resolveType(typeNode.getParen().type, symbol, contextSpan);
      }
      case "primitive":
        symbol.type = typeNode;
        return true;
      default:
        this.config.services.diagnosticManager.reportError("UnsupportedType", `Unsupported type kind: ${typeNode.kind}`, typeNode.span);
        return false;
    }
  }
  scopeMatchesStruct(scope, struct) {
    const structFields = struct.members.filter((m) => m.isField());
    const scopeFields = Array.from(scope.symbols.values()).filter(
      (s) => s.kind === "StructField"
      /* StructField */
    );
    if (scopeFields.length !== structFields.length) {
      return false;
    }
    for (const member of structFields) {
      const field = member.source;
      const fieldName = field.ident.name;
      if (!scope.symbols.has(fieldName)) {
        return false;
      }
      const scopeSymbol = scope.symbols.get(fieldName);
      if (scopeSymbol.kind !== "StructField") {
        return false;
      }
    }
    return true;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [x] VALIDATION ───────────────────────────┐
  checkParameterForwardReference(ident, parameterContext) {
    const forwardRefResult = this.config.services.contextTracker.checkParameterForwardReference(
      ident.name,
      parameterContext.currentFieldIndex,
      parameterContext.parameters
    );
    if (forwardRefResult.isForwardReference) {
      this.reportError(
        "PARAMETER_FORWARD_REFERENCE",
        `Parameter '${parameterContext.parameters[parameterContext.currentFieldIndex].name}' default value refers to parameter '${ident.name}' which is not yet declared`,
        ident.span
      );
      this.stats.forwardReferences++;
      return true;
    }
    return false;
  }
  checkSelfReference(ident) {
    var _a;
    const selfRefResult = this.config.services.contextTracker.checkSelfReference(ident.name, ident.span);
    if (selfRefResult.isSelfReference) {
      const errorCode = selfRefResult.errorType === "VARIABLE_SELF_INIT" ? "VARIABLE_SELF_INIT" : "PARAMETER_SELF_INIT";
      const symbolType = (_a = selfRefResult.declarationContext) == null ? void 0 : _a.symbolKind;
      this.reportError(
        errorCode,
        `${symbolType} '${ident.name}' cannot be initialized using itself`,
        ident.span
      );
      this.stats.selfReferences++;
      return true;
    }
    return false;
  }
  validateSymbolUsage(symbol, ident, contextSpan) {
    this.log("symbols", `Validating usage of symbol '${symbol.name}'`);
    if (contextSpan) {
      this.config.services.contextTracker.pushContextSpan(contextSpan);
    }
    if (!symbol.declared) {
      this.reportError(
        "USED_BEFORE_DECLARED",
        `Symbol '${ident.name}' used before declaration`,
        ident.span
      );
    }
    if (symbol.kind === "Variable" && !symbol.initialized) {
      this.reportError(
        "USED_BEFORE_INITIALIZED",
        `Variable '${ident.name}' used before initialization`,
        ident.span
      );
    }
    if (contextSpan) {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  init() {
    this.config.services.contextTracker.reset();
    this.config.services.contextTracker.setPhase(
      "Resolution"
      /* Resolution */
    );
    this.stats.totalSymbols = Array.from(this.config.services.scopeManager.getAllSymbols()).length;
    const globalScope = this.config.services.scopeManager.getGlobalScope();
    this.config.services.scopeManager.setCurrentScope(globalScope.id);
    this.config.services.contextTracker.setScope(globalScope.id);
    this.log("verbose", `Resolution initialized: ${this.stats.totalSymbols} symbols to resolve`);
    return true;
  }
  initStats() {
    return {
      totalSymbols: 0,
      resolvedSymbols: 0,
      cachedResolutions: 0,
      forwardReferences: 0,
      selfReferences: 0,
      importResolutions: 0,
      structMethodsResolved: 0,
      enumVariantsResolved: 0,
      memberAccessResolved: 0,
      anonymousTypesResolved: 0,
      visibilityChecks: 0,
      errors: 0,
      modulesProcessed: 0,
      startTime: Date.now()
    };
  }
  initResolutionContext() {
    return {
      currentModule: "",
      moduleStack: [],
      cache: /* @__PURE__ */ new Map()
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  createCacheKey(ident) {
    const scope = this.config.services.scopeManager.getCurrentScope();
    const moduleName = this.resolutionCtx.currentModule;
    return `${moduleName}:${ident.name}:${ident.span.start}:${ident.span.end}`;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  logStatistics() {
    const duration = Date.now() - this.stats.startTime;
    this.log(
      "verbose",
      `Resolution Statistics      :
  Duration                 : ${duration}ms
  Total symbols            : ${this.stats.totalSymbols}
  Resolved symbols         : ${this.stats.resolvedSymbols}
  Cached resolutions       : ${this.stats.cachedResolutions}
  Forward references       : ${this.stats.forwardReferences}
  Self references          : ${this.stats.selfReferences}
  Import resolutions       : ${this.stats.importResolutions}
  Struct methods resolved  : ${this.stats.structMethodsResolved}
  Enum variants resolved   : ${this.stats.enumVariantsResolved}
  Member access resolved   : ${this.stats.memberAccessResolved}
  Anonymous types resolved : ${this.stats.anonymousTypesResolved}
  Visibility checks        : ${this.stats.visibilityChecks}
  Errors                   : ${this.stats.errors}`
    );
  }
  // └──────────────────────────────────────────────────────────────────────┘
};
var ExpressionEvaluator = class {
  // i64::MIN
  constructor(config) {
    this.config = config;
    this.MAX_INT_64 = BigInt("9223372036854775807");
    this.MIN_INT_64 = BigInt("-9223372036854775808");
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  evaluateComptimeExpression(expr, targetType) {
    const bounds = this.getTypeBounds(targetType);
    const result = this.evaluateExpression(expr, {
      allowFloats: false,
      maxIntValue: BigInt("9223372036854775807"),
      // ✅ Use max range during evaluation
      minIntValue: BigInt("-9223372036854775808"),
      targetType
    });
    if (!result) return null;
    if (result.type !== "int") {
      return null;
    }
    const value = result.value;
    if (targetType && (value < bounds.min || value > bounds.max)) {
      this.reportError(
        "ARITHMETIC_OVERFLOW",
        `Value ${value} does not fit in type '${targetType.toString()}' (valid range: ${bounds.min} to ${bounds.max})`,
        expr.span
      );
      return null;
    }
    return value;
  }
  getTypeBounds(type) {
    if (!type) {
      return { min: this.MIN_INT_64, max: this.MAX_INT_64 };
    }
    if (type.isSigned()) {
      const width = type.getWidth() || 64;
      const max = BigInt(2) ** BigInt(width - 1) - BigInt(1);
      const min = -(BigInt(2) ** BigInt(width - 1));
      return { min, max };
    }
    if (type.isUnsigned()) {
      const width = type.getWidth() || 64;
      const max = BigInt(2) ** BigInt(width) - BigInt(1);
      return { min: BigInt(0), max };
    }
    if (type.isComptimeInt()) {
      return { min: this.MIN_INT_64, max: this.MAX_INT_64 };
    }
    return { min: this.MIN_INT_64, max: this.MAX_INT_64 };
  }
  evaluateExpression(expr, ctx) {
    const context = ctx || {
      allowFloats: true,
      maxIntValue: this.MAX_INT_64,
      minIntValue: this.MIN_INT_64
    };
    try {
      switch (expr.kind) {
        case "Primary":
          return this.evaluatePrimary(expr.getPrimary(), context);
        case "Binary":
          return this.evaluateBinary(expr.getBinary(), context);
        case "Prefix":
          return this.evaluatePrefix(expr.getPrefix(), context);
        case "As":
          return this.evaluateAs(expr.getAs(), context);
        case "Sizeof":
          return this.evaluateSizeof(expr.getSizeof(), context);
        default:
          return null;
      }
    } catch (error) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Error evaluating compile-time expression: ${error}`,
        expr.span
      );
      return null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  evaluatePrimary(primary, ctx) {
    switch (primary.kind) {
      case "Literal":
        return this.evaluateLiteral(primary.getLiteral(), ctx);
      case "Ident":
        return this.evaluateIdentifier(primary.getIdent(), ctx);
      case "Paren": {
        const paren = primary.getParen();
        return paren.source ? this.evaluateExpression(paren.source, ctx) : null;
      }
      default:
        return null;
    }
  }
  evaluateLiteral(literal, ctx) {
    switch (literal.kind) {
      case "Integer": {
        try {
          const value = BigInt(literal.value);
          return { value, type: "int" };
        } catch (e) {
          this.reportError(
            "ANALYSIS_ERROR",
            `Invalid integer literal: ${literal.value}`,
            literal.span
          );
          return null;
        }
      }
      case "Float": {
        if (!ctx.allowFloats) {
          this.reportError(
            "TYPE_MISMATCH",
            "Float literals not allowed in integer-only context",
            literal.span
          );
          return null;
        }
        try {
          const value = parseFloat(literal.value);
          if (!isFinite(value)) {
            this.reportError(
              "ARITHMETIC_OVERFLOW",
              "Float literal out of valid range",
              literal.span
            );
            return null;
          }
          return { value, type: "float" };
        } catch (e) {
          this.reportError(
            "ANALYSIS_ERROR",
            `Invalid float literal: ${literal.value}`,
            literal.span
          );
          return null;
        }
      }
      case "Bool":
        return { value: literal.value, type: "bool" };
      case "Null":
        return { value: null, type: "null" };
      default:
        return null;
    }
  }
  evaluateIdentifier(ident, ctx) {
    const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
    if (!symbol) return null;
    if (symbol.kind !== "Definition" && symbol.kind !== "Variable") {
      return null;
    }
    if (symbol.mutability.kind !== "Immutable") {
      return null;
    }
    if (symbol.metadata && typeof symbol.metadata === "object") {
      const metadata = symbol.metadata;
      if (metadata.initializer) {
        return this.evaluateExpression(metadata.initializer, ctx);
      }
    }
    return null;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  evaluateBinary(binary, ctx) {
    const left = this.evaluateExpression(binary.left, ctx);
    const right = this.evaluateExpression(binary.right, ctx);
    if (!left || !right) return null;
    if (!this.areTypesCompatible(left.type, right.type, binary.kind)) {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot perform ${binary.kind} operation on incompatible types '${left.type}' and '${right.type}'`,
        binary.span
      );
      return null;
    }
    switch (binary.kind) {
      case "Additive":
        return this.evaluateAdditive(left, right, binary.operator, binary.span);
      case "Multiplicative":
        return this.evaluateMultiplicative(left, right, binary.operator, binary.span);
      case "Power":
        return this.evaluatePower(left, right, binary.span);
      case "Shift":
        return this.evaluateShift(left, right, binary.operator, binary.span);
      case "BitwiseAnd":
      case "BitwiseXor":
      case "BitwiseOr":
        return this.evaluateBitwise(left, right, binary.kind, binary.span);
      case "Relational":
      case "Equality":
        return this.evaluateComparison(left, right, binary.operator, binary.span);
      case "LogicalAnd":
      case "LogicalOr":
        return this.evaluateLogical(left, right, binary.kind, binary.span);
      default:
        return null;
    }
  }
  evaluateAdditive(left, right, op, span) {
    if (left.type === "bool" || right.type === "bool") {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot perform ${op === "+" ? "addition" : "subtraction"} on boolean type`,
        span
      );
      return null;
    }
    if (left.type === "float" || right.type === "float") {
      const l2 = this.toFloat(left);
      const r2 = this.toFloat(right);
      const result = op === "+" ? l2 + r2 : l2 - r2;
      if (!isFinite(result)) {
        this.reportError(
          "ARITHMETIC_OVERFLOW",
          `Float ${op === "+" ? "addition" : "subtraction"} overflow`,
          span
        );
        return null;
      }
      return { value: result, type: "float" };
    }
    const l = left.value;
    const r = right.value;
    try {
      const result = op === "+" ? l + r : l - r;
      if (result > this.MAX_INT_64 || result < this.MIN_INT_64) {
        this.reportError(
          "ARITHMETIC_OVERFLOW",
          `Integer ${op === "+" ? "addition" : "subtraction"} overflow: ${l} ${op} ${r} = ${result}`,
          span
        );
        return null;
      }
      return { value: result, type: "int" };
    } catch (e) {
      this.reportError(
        "ARITHMETIC_OVERFLOW",
        `Integer ${op === "+" ? "addition" : "subtraction"} overflow`,
        span
      );
      return null;
    }
  }
  evaluateMultiplicative(left, right, op, span) {
    if (left.type === "bool" || right.type === "bool") {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot perform ${op === "+" ? "addition" : "subtraction"} on boolean type`,
        span
      );
      return null;
    }
    if (left.type === "float" || right.type === "float") {
      const l2 = this.toFloat(left);
      const r2 = this.toFloat(right);
      if (op === "/" && r2 === 0) {
        this.reportError(
          "DIVISION_BY_ZERO",
          "Division by zero in compile-time expression",
          span
        );
        return null;
      }
      if (op === "%" && r2 === 0) {
        this.reportError(
          "DIVISION_BY_ZERO",
          "Modulo by zero in compile-time expression",
          span
        );
        return null;
      }
      let result;
      switch (op) {
        case "*":
          result = l2 * r2;
          break;
        case "/":
          result = l2 / r2;
          break;
        case "%":
          result = l2 % r2;
          break;
        default:
          return null;
      }
      if (!isFinite(result)) {
        this.reportError(
          "ARITHMETIC_OVERFLOW",
          `Float ${op} overflow`,
          span
        );
        return null;
      }
      return { value: result, type: "float" };
    }
    const l = left.value;
    const r = right.value;
    if ((op === "/" || op === "%") && r === BigInt(0)) {
      this.reportError(
        "DIVISION_BY_ZERO",
        `${op === "/" ? "Division" : "Modulo"} by zero in compile-time expression`,
        span
      );
      return null;
    }
    try {
      let result;
      switch (op) {
        case "*":
          result = l * r;
          break;
        case "/":
          result = l / r;
          break;
        case "%":
          result = l % r;
          break;
        default:
          return null;
      }
      if (result > this.MAX_INT_64 || result < this.MIN_INT_64) {
        this.reportError(
          "ARITHMETIC_OVERFLOW",
          `Integer ${op} overflow: ${l} ${op} ${r}`,
          span
        );
        return null;
      }
      return { value: result, type: "int" };
    } catch (e) {
      this.reportError(
        "ARITHMETIC_OVERFLOW",
        `Integer ${op} overflow`,
        span
      );
      return null;
    }
  }
  evaluatePower(left, right, span) {
    if (left.type === "float" || right.type === "float") {
      const l = this.toFloat(left);
      const r = this.toFloat(right);
      const result = Math.pow(l, r);
      if (!isFinite(result)) {
        this.reportError(
          "ARITHMETIC_OVERFLOW",
          "Float power overflow",
          span
        );
        return null;
      }
      return { value: result, type: "float" };
    }
    const base = left.value;
    const exp = right.value;
    if (exp < BigInt(0)) {
      this.reportError(
        "ANALYSIS_ERROR",
        "Negative exponent not allowed in compile-time integer expression",
        span
      );
      return null;
    }
    if (exp > BigInt(1e4)) {
      this.reportError(
        "ARITHMETIC_OVERFLOW",
        "Exponent too large for compile-time evaluation",
        span
      );
      return null;
    }
    try {
      const result = base ** exp;
      if (result > this.MAX_INT_64 || result < this.MIN_INT_64) {
        this.reportError(
          "ARITHMETIC_OVERFLOW",
          `Integer power overflow: ${base} ** ${exp}`,
          span
        );
        return null;
      }
      return { value: result, type: "int" };
    } catch (e) {
      this.reportError(
        "ARITHMETIC_OVERFLOW",
        "Integer power overflow",
        span
      );
      return null;
    }
  }
  evaluateShift(left, right, op, span) {
    if (left.type !== "int" || right.type !== "int") {
      this.reportError(
        "TYPE_MISMATCH",
        "Shift operations require integer operands",
        span
      );
      return null;
    }
    const value = left.value;
    const shift = right.value;
    if (shift < BigInt(0)) {
      this.reportError(
        "ANALYSIS_ERROR",
        "Negative shift amount not allowed",
        span
      );
      return null;
    }
    if (shift > BigInt(63)) {
      this.reportError(
        "ANALYSIS_ERROR",
        "Shift amount too large (max 63 bits)",
        span
      );
      return null;
    }
    const shiftNum = Number(shift);
    const result = op === "<<" ? value << BigInt(shiftNum) : value >> BigInt(shiftNum);
    return { value: result, type: "int" };
  }
  evaluateBitwise(left, right, op, span) {
    if (left.type !== "int" || right.type !== "int") {
      this.reportError(
        "TYPE_MISMATCH",
        "Bitwise operations require integer operands",
        span
      );
      return null;
    }
    const l = left.value;
    const r = right.value;
    let result;
    switch (op) {
      case "BitwiseAnd":
        result = l & r;
        break;
      case "BitwiseXor":
        result = l ^ r;
        break;
      case "BitwiseOr":
        result = l | r;
        break;
    }
    return { value: result, type: "int" };
  }
  evaluateComparison(left, right, op, span) {
    if (left.type === "null" || right.type === "null") {
      if (op === "==" || op === "!=") {
        const result = left.value === right.value === (op === "==");
        return { value: result, type: "bool" };
      }
      return null;
    }
    if (left.type === "float" || right.type === "float") {
      const l = this.toFloat(left);
      const r = this.toFloat(right);
      return { value: this.compare(l, r, op), type: "bool" };
    }
    if (left.type === "int" && right.type === "int") {
      const l = left.value;
      const r = right.value;
      return { value: this.compare(l, r, op), type: "bool" };
    }
    if (left.type === "bool" && right.type === "bool") {
      if (op === "==" || op === "!=") {
        const result = left.value === right.value === (op === "==");
        return { value: result, type: "bool" };
      }
    }
    return null;
  }
  evaluateLogical(left, right, op, span) {
    if (left.type !== "bool" || right.type !== "bool") {
      this.reportError(
        "TYPE_MISMATCH",
        "Logical operations require boolean operands",
        span
      );
      return null;
    }
    const l = left.value;
    const r = right.value;
    const result = op === "LogicalAnd" ? l && r : l || r;
    return { value: result, type: "bool" };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  evaluatePrefix(prefix, ctx) {
    const value = this.evaluateExpression(prefix.expr, ctx);
    if (!value) return null;
    switch (prefix.kind) {
      case "UnaryPlus":
        if (value.type !== "int" && value.type !== "float") {
          this.reportError(
            "TYPE_MISMATCH",
            `Unary '+' requires numeric operand, got '${value.type}'`,
            prefix.span
          );
          return null;
        }
        return value;
      case "UnaryMinus":
        if (value.type !== "int" && value.type !== "float") {
          this.reportError(
            "TYPE_MISMATCH",
            `Unary '-' requires numeric operand, got '${value.type}'`,
            prefix.span
          );
          return null;
        }
        if (value.type === "int") {
          const result = -value.value;
          if (result > this.MAX_INT_64 || result < this.MIN_INT_64) {
            this.reportError(
              "ARITHMETIC_OVERFLOW",
              "Integer negation overflow",
              prefix.span
            );
            return null;
          }
          return { value: result, type: "int" };
        }
        if (value.type === "float") {
          return { value: -value.value, type: "float" };
        }
        return null;
      case "LogicalNot":
        if (value.type !== "bool") {
          this.reportError(
            "TYPE_MISMATCH",
            `Logical not requires boolean operand, got '${value.type}'`,
            prefix.span
          );
          return null;
        }
        return { value: !value.value, type: "bool" };
      case "BitwiseNot":
        if (value.type !== "int") {
          this.reportError(
            "TYPE_MISMATCH",
            `Bitwise not requires integer operand, got '${value.type}'`,
            prefix.span
          );
          return null;
        }
        return { value: ~value.value, type: "int" };
      default:
        return null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  evaluateAs(asNode, ctx) {
    const value = this.evaluateExpression(asNode.base, ctx);
    if (!value) return null;
    const targetType = asNode.type;
    if (value.type === "int" && this.isFloatType(targetType)) {
      return { value: Number(value.value), type: "float" };
    }
    if (value.type === "float" && this.isIntegerType(targetType)) {
      const intValue = BigInt(Math.trunc(value.value));
      if (intValue > this.MAX_INT_64 || intValue < this.MIN_INT_64) {
        this.reportError(
          "ARITHMETIC_OVERFLOW",
          "Float to integer conversion overflow",
          asNode.span
        );
        return null;
      }
      return { value: intValue, type: "int" };
    }
    return value;
  }
  evaluateSizeof(sizeofNode, ctx) {
    const type = sizeofNode.expr.getType();
    return { value: this.computeTypeSize(type), type: "int" };
  }
  computeTypeSize(type) {
    switch (type.kind) {
      case "primitive": {
        const prim = type.getPrimitive();
        if (prim.width !== void 0) {
          return prim.width;
        }
        switch (prim.kind) {
          case "bool":
            return 1;
          case "void":
            return 0;
          default:
            return null;
        }
      }
      case "pointer":
        return 64;
      // Assume 64-bit pointers
      case "optional":
        const inner = type.getOptional().target;
        const innerSize = this.computeTypeSize(inner);
        return innerSize !== null ? innerSize + 1 : null;
      case "array": {
        const arr = type.getArray();
        const elemSize = this.computeTypeSize(arr.target);
        if (elemSize === null) return null;
        if (arr.size) {
          const sizeValue = this.extractIntegerValue(arr.size);
          if (sizeValue !== void 0) {
            return elemSize * sizeValue;
          }
        }
        return null;
      }
      case "tuple": {
        const tuple = type.getTuple();
        let totalSize = 0;
        for (const field of tuple.fields) {
          const fieldSize = this.computeTypeSize(field);
          if (fieldSize === null) return null;
          totalSize += fieldSize;
        }
        return totalSize;
      }
      case "struct": {
        const struct = type.getStruct();
        let totalSize = 0;
        for (const member of struct.members) {
          if (member.isField()) {
            const field = member.getField();
            if (field.type) {
              const fieldSize = this.computeTypeSize(field.type);
              if (fieldSize === null) return null;
              totalSize += fieldSize;
            }
          }
        }
        return totalSize;
      }
      default:
        return null;
    }
  }
  extractIntegerValue(expr) {
    const comptimeValue = this.evaluateComptimeExpression(expr);
    if (comptimeValue === null) return void 0;
    if (comptimeValue > BigInt(Number.MAX_SAFE_INTEGER) || comptimeValue < BigInt(Number.MIN_SAFE_INTEGER)) {
      return void 0;
    }
    return Number(comptimeValue);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  areTypesCompatible(t1, t2, op) {
    if (t1 === t2) {
      if (t1 === "bool") {
        return op === "LogicalAnd" || op === "LogicalOr" || op === "Equality" || op === "Relational";
      }
      if (t1 === "null") {
        return op === "Equality" || op === "Relational";
      }
      return true;
    }
    if ((t1 === "int" || t1 === "float") && (t2 === "int" || t2 === "float")) {
      if (op === "BitwiseAnd" || op === "BitwiseXor" || op === "BitwiseOr" || op === "Shift") {
        return t1 === "int" && t2 === "int";
      }
      return true;
    }
    if (t1 === "bool" || t2 === "bool") {
      return false;
    }
    if (t1 === "null" || t2 === "null") {
      return op === "Equality";
    }
    return false;
  }
  toFloat(result) {
    if (result.type === "float") return result.value;
    if (result.type === "int") return Number(result.value);
    return 0;
  }
  compare(l, r, op) {
    switch (op) {
      case "==":
        return l === r;
      case "!=":
        return l !== r;
      case "<":
        return l < r;
      case "<=":
        return l <= r;
      case ">":
        return l > r;
      case ">=":
        return l >= r;
      default:
        return false;
    }
  }
  isFloatType(type) {
    return type.isFloat() || type.isComptimeFloat();
  }
  isIntegerType(type) {
    return type.isSigned() || type.isUnsigned() || type.isComptimeInt();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  reportError(code, message, span) {
    this.config.services.diagnosticManager.reportError(code, message, span);
  }
  reportWarning(code, message, span) {
    this.config.services.diagnosticManager.reportWarning(code, message, span);
  }
  reportInfo(code, message, span) {
    this.config.services.diagnosticManager.reportInfo(code, message, span);
  }
  // └──────────────────────────────────────────────────────────────────────┘
};
var TypeValidator = class extends PhaseBase {
  constructor(config) {
    super("TypeValidation", config);
    this.stats = this.initStats();
    this.typeCtx = this.initTypeValidatorContext();
    this.inferenceStack = /* @__PURE__ */ new Set();
    this.circularTypeDetectionStack = /* @__PURE__ */ new Set();
    this.currentFunctionReturnType = null;
    this.hasReturnStatement = false;
    this.currentFunctionErrorType = null;
    this.hasThrowStatement = false;
    this.currentIsStaticMethod = false;
    this.currentStructScope = null;
    this.CACHE_MAX_SIZE = 1e4;
    this.ExpressionEvaluator = new ExpressionEvaluator(this.config);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ─────────────────────────────────┐
  handle() {
    try {
      this.log("verbose", "Starting symbol validation phase...");
      this.stats.startTime = Date.now();
      if (!this.init()) return false;
      if (!this.validateAllModules()) return false;
      this.logStatistics();
      return !this.config.services.diagnosticManager.hasErrors();
    } catch (error) {
      this.log("errors", `Fatal error during type validation: ${error}`);
      this.reportError("INTERNAL_ERROR", `Fatal error during type validation: ${error}`);
      return false;
    }
  }
  reset() {
    this.inferenceStack.clear();
    this.circularTypeDetectionStack.clear();
    this.stats = this.initStats();
    this.typeCtx = this.initTypeValidatorContext();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────── [1] Program Level ─────────────────────────┐
  validateAllModules() {
    this.log("verbose", "Validating types from all modules...");
    const globalScope = this.config.services.scopeManager.getCurrentScope();
    for (const [moduleName, module] of this.config.program.modules) {
      this.config.services.contextTracker.pushContextSpan({ start: 0, end: 0 });
      try {
        if (!this.validateModule(moduleName, module, globalScope)) {
          this.log("errors", `Failed to validate module ${moduleName}, continuing...`);
        }
        this.stats.modulesProcessed++;
      } finally {
        this.config.services.contextTracker.popContextSpan();
      }
    }
    return true;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────── [2] Module Level ──────────────────────────┐
  validateModule(moduleName, module, parentScope) {
    var _a;
    this.log("symbols", `Validating module '${moduleName}'`);
    try {
      this.config.services.contextTracker.setModuleName(moduleName);
      if (typeof ((_a = module.metadata) == null ? void 0 : _a.path) === "string") {
        this.config.services.contextTracker.setModulePath(module.metadata.path);
      }
      this.enterModuleContext(moduleName, module);
      const moduleScope = this.findModuleScope(moduleName);
      if (!moduleScope) {
        this.reportError("MODULE_SCOPE_NOT_FOUND", `Module scope for '${moduleName}' not found`);
        return false;
      }
      this.config.services.scopeManager.setCurrentScope(moduleScope.id);
      this.config.services.contextTracker.setScope(moduleScope.id);
      for (const statement of module.statements) {
        this.validateStmt(statement, moduleScope, moduleName);
      }
      this.exitModuleContext();
      return true;
    } catch (error) {
      this.reportError("INTERNAL_ERROR", `Failed to validate module '${moduleName}': ${error}`);
      return false;
    }
  }
  enterModuleContext(moduleName, module) {
    var _a;
    this.typeCtx.moduleStack.push(this.typeCtx.currentModule);
    this.typeCtx.currentModule = moduleName;
    this.config.services.contextTracker.setModuleName(moduleName);
    if (typeof ((_a = module.metadata) == null ? void 0 : _a.path) === "string") {
      this.config.services.contextTracker.setModulePath(module.metadata.path);
    }
  }
  exitModuleContext() {
    const previousModule = this.typeCtx.moduleStack.pop();
    this.typeCtx.currentModule = previousModule || "";
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [3] Stmt Level ───────────────────────────┐
  validateStmt(stmt, currentScope, moduleName) {
    if (!currentScope) {
      currentScope = this.config.services.scopeManager.getCurrentScope();
    }
    if (!stmt) {
      this.reportError("ANALYSIS_ERROR", "Found null statement during validation");
      return;
    }
    this.log("verbose", `Validating ${stmt.kind} statement`);
    this.config.services.contextTracker.pushContextSpan(stmt.span);
    try {
      this.config.services.scopeManager.withScope(currentScope.id, () => {
        this.config.services.contextTracker.withSavedState(() => {
          this.config.services.contextTracker.setScope(currentScope.id);
          this.processStmt(stmt, currentScope, moduleName);
        });
      });
    } catch (error) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Failed to validate ${stmt.kind} statement: ${error}`,
        stmt.span
      );
    } finally {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  processStmt(stmt, currentScope, moduleName) {
    const nodeGetter = this.getNodeGetter(stmt);
    if (!nodeGetter) {
      this.reportError("INTERNAL_ERROR", `Invalid AST: ${stmt.kind} node is null`);
      return;
    }
    switch (stmt.kind) {
      case "Block":
        this.handleBlockStmt(stmt.getBlock(), currentScope, moduleName);
        break;
      case "Test":
        this.handleTestStmt(stmt.getTest(), currentScope, moduleName);
        break;
      case "Use":
        break;
      case "Def":
        this.handleDefStmt(stmt.getDef(), currentScope, moduleName);
        break;
      case "Let":
        this.handleLetStmt(stmt.getLet(), currentScope, moduleName);
        break;
      case "Func":
        this.handleFuncStmt(stmt.getFunc(), currentScope, moduleName);
        break;
      case "While":
      case "Do":
      case "For":
        this.handleLoopStmt(stmt);
        break;
      case "Return":
      case "Defer":
      case "Throw":
        this.handleControlflowStmt(stmt);
        break;
      case "Expression": {
        const expr = stmt.getExpr();
        if (expr.kind === "Binary") {
          const binary = expr.getBinary();
          if (binary && binary.kind === "Assignment") {
            this.validateAssignment(binary);
          }
        }
        this.inferExpressionType(expr);
        break;
      }
    }
  }
  getNodeGetter(stmt) {
    switch (stmt.kind) {
      case "Def":
        return () => stmt.getDef();
      case "Use":
        return () => stmt.getUse();
      case "Let":
        return () => stmt.getLet();
      case "Func":
        return () => stmt.getFunc();
      case "Block":
        return () => stmt.getBlock();
      case "Return":
      case "Defer":
      case "Throw":
        return () => stmt.getCtrlflow();
      case "While":
      case "Do":
      case "For":
        return () => stmt.getLoop();
      case "Expression":
        return () => stmt.getExpr();
      case "Test":
        return () => stmt.getTest();
      default:
        return null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────── [3.1] BLOCK ─────────────────────────────┐
  handleBlockStmt(blockNode, scope, moduleName) {
    this.validateBlockStmt(blockNode);
  }
  validateBlockStmt(block, scope, moduleName) {
    this.log("symbols", "Validating block");
    const blockScope = this.config.services.scopeManager.findChildScopeByName(
      "block",
      "Block"
      /* Block */
    );
    if (blockScope) {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.contextTracker.setScope(blockScope.id);
        this.config.services.scopeManager.withScope(blockScope.id, () => {
          for (const stmt of block.stmts) {
            this.validateStmt(stmt, blockScope);
          }
        });
      });
    }
  }
  handleTestStmt(testNode, scope, moduleName) {
    this.validateBlockStmt(testNode.block, scope, moduleName);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.2] USE ──────────────────────────────┐
  // Skipped for now.
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.3] DEF ──────────────────────────────┐
  handleDefStmt(defNode, scope, moduleName) {
    this.validateDefStmt(defNode);
  }
  validateDefStmt(defNode) {
    this.log("symbols", `Type checking definition '${defNode.ident.name}'`);
    const symbol = this.config.services.scopeManager.getSymbolInCurrentScope(defNode.ident.name);
    if (!symbol) return;
    if (defNode.type) {
      if (!this.checkCircularTypeDependency(defNode.type, defNode.ident.name, true)) {
        this.resolveTypeNode(defNode.type);
      }
    }
    symbol.isTypeChecked = true;
    symbol.type = defNode.type;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.4] LET ──────────────────────────────┐
  handleLetStmt(letNode, scope, moduleName) {
    this.validateLetStmt(letNode);
  }
  validateLetStmt(letNode) {
    this.log("symbols", `Type checking variable '${letNode.field.ident.name}'`);
    const symbol = this.config.services.scopeManager.getSymbolInCurrentScope(letNode.field.ident.name);
    if (!symbol) return;
    const currentScope = this.config.services.scopeManager.getCurrentScope();
    if (letNode.field.visibility.kind === "Static") {
      const currentScope2 = this.config.services.scopeManager.getCurrentScope();
      if (currentScope2.kind !== "Type") {
        this.reportError(
          "INVALID_VISIBILITY",
          `Variable '${letNode.field.ident.name}' cannot be 'static' outside of struct/enum`,
          letNode.field.ident.span
        );
        return;
      }
    }
    if (letNode.field.type) {
      if (this.checkCircularTypeDependency(letNode.field.type, letNode.field.ident.name, false)) {
        return;
      }
      this.resolveTypeNode(letNode.field.type);
    }
    let initType = null;
    if (letNode.field.initializer) {
      initType = this.extractTypeFromInitializer(letNode.field.initializer);
      if (initType && (initType.isStruct() || initType.isEnum())) {
        if (initType.isStruct()) {
          this.validateStructType(initType.getStruct(), symbol);
        }
        symbol.type = initType;
        symbol.isTypeChecked = true;
        return;
      }
    }
    let structTypeToValidate = null;
    let objectNodeToValidate = null;
    if (letNode.field.type && letNode.field.initializer) {
      this.validateValueFitsInType(letNode.field.initializer, letNode.field.type);
      let actualType = this.resolveIdentifierType(letNode.field.type);
      if (actualType.isStruct()) {
        if (letNode.field.initializer.is("Primary")) {
          const primary = letNode.field.initializer.getPrimary();
          if (primary && primary.is("Object")) {
            const obj = primary.getObject();
            structTypeToValidate = actualType;
            objectNodeToValidate = obj;
          }
        }
      }
    } else if (letNode.field.initializer && !letNode.field.type) {
      if (letNode.field.initializer.is("Primary")) {
        const primary = letNode.field.initializer.getPrimary();
        if (primary && primary.is("Object")) {
          const obj = primary.getObject();
          if (obj.ident) {
            const typeSymbol = this.config.services.scopeManager.lookupSymbol(obj.ident.name);
            if (typeSymbol && typeSymbol.type) {
              let actualType = this.resolveIdentifierType(typeSymbol.type);
              if (actualType.isStruct()) {
                structTypeToValidate = actualType;
                objectNodeToValidate = obj;
                letNode.field.type = typeSymbol.type;
                symbol.type = typeSymbol.type;
              }
            }
          }
        }
      }
    }
    if (structTypeToValidate && objectNodeToValidate) {
      this.validateStructConstruction(objectNodeToValidate, structTypeToValidate, letNode.field.initializer.span);
      symbol.isTypeChecked = true;
      this.stats.typesInferred++;
      return;
    }
    if (letNode.field.initializer) {
      const initType2 = this.inferExpressionType(letNode.field.initializer);
      if (initType2) {
        if (!letNode.field.type) {
          letNode.field.type = initType2;
          symbol.type = initType2;
          this.stats.typesInferred++;
        } else {
          if (!this.validateArrayAssignment(
            letNode.field.type,
            initType2,
            letNode.field.initializer.span,
            `Variable '${letNode.field.ident.name}'`
          )) {
            symbol.isTypeChecked = true;
            return;
          }
          if (!this.isTypeCompatible(letNode.field.type, initType2)) {
            this.reportError(
              "TYPE_MISMATCH",
              `Cannot assign type '${initType2.toString()}' to variable of type '${letNode.field.type.toString()}'`,
              initType2.span
            );
          }
        }
      }
    } else if (!letNode.field.type) {
      this.reportError(
        "CANNOT_INFER_TYPE",
        `Variable '${letNode.field.ident.name}' requires explicit type or initializer`,
        letNode.field.span
      );
    }
    if (letNode.field.initializer) {
      if (letNode.field.type) {
        this.validateValueFitsInType(letNode.field.initializer, letNode.field.type);
      } else if (initType) {
        this.validateValueFitsInType(letNode.field.initializer, initType);
      }
    }
    symbol.isTypeChecked = true;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.5] FUNC ─────────────────────────────┐
  handleFuncStmt(funcNode, scope, moduleName) {
    this.validateFuncStmt(funcNode);
  }
  validateFuncStmt(funcNode) {
    var _a, _b;
    this.log("symbols", `Type checking function '${funcNode.ident.name}'`);
    const funcSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(funcNode.ident.name);
    if (!funcSymbol) {
      this.reportError(
        "CANNOT_INFER_TYPE",
        `Function '${funcNode.ident.name}' symbol not found`,
        funcNode.span
      );
      return;
    }
    const funcScope = this.config.services.scopeManager.findChildScopeByName(
      funcNode.ident.name,
      "Function"
      /* Function */
    );
    if (!funcScope) {
      this.reportError(
        "CANNOT_INFER_TYPE",
        `Function scope for '${funcNode.ident.name}' not found`,
        funcNode.span
      );
      return;
    }
    const funcSymbolScope = this.config.services.scopeManager.getScope(funcSymbol.scope);
    const parentScope = funcSymbolScope.kind === "Type" && ((_a = funcSymbolScope.metadata) == null ? void 0 : _a.typeKind) === "Struct" ? funcSymbolScope : null;
    const isStaticMethod = parentScope !== null && funcNode.visibility.kind === "Static";
    const isInstanceMethod = parentScope !== null && !(funcNode.visibility.kind === "Static");
    const previousIsStaticMethod = this.currentIsStaticMethod;
    const previousStructScope = this.currentStructScope;
    this.currentIsStaticMethod = isStaticMethod;
    this.currentStructScope = isStaticMethod || isInstanceMethod ? parentScope : null;
    this.log("symbols", `Function '${funcNode.ident.name}': isStatic=${isStaticMethod}, isInstance=${isInstanceMethod}, structScope=${((_b = this.currentStructScope) == null ? void 0 : _b.name) || "none"}`);
    const previousReturnType = this.currentFunctionReturnType;
    const previousHasReturnStmt = this.hasReturnStatement;
    const previousErrorType = this.currentFunctionErrorType;
    const previousHasThrowStmt = this.hasThrowStatement;
    this.currentFunctionReturnType = funcNode.returnType || null;
    this.hasReturnStatement = false;
    this.currentFunctionErrorType = funcNode.errorType || null;
    this.hasThrowStatement = false;
    try {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.scopeManager.withScope(funcScope.id, () => {
          var _a2, _b2, _c, _d;
          if (isInstanceMethod) {
            this.resolveSelfParameter(funcScope, parentScope);
          }
          for (const param of funcNode.parameters) {
            this.validateParameter(param);
          }
          const paramTypes = [];
          for (const param of funcNode.parameters) {
            if (param.type) {
              paramTypes.push(param.type);
            } else {
              const paramSymbol = funcScope.symbols.get(param.ident.name);
              if (paramSymbol == null ? void 0 : paramSymbol.type) {
                paramTypes.push(paramSymbol.type);
              } else {
                this.reportError(
                  "CANNOT_INFER_TYPE",
                  `Cannot infer type for parameter '${param.ident.name}'`,
                  param.span
                );
                paramTypes.push(TypeNode.asUndefined(param.span));
              }
            }
          }
          funcSymbol.type = TypeNode.asFunction(
            funcNode.span,
            paramTypes,
            (_b2 = (_a2 = funcNode.returnType) != null ? _a2 : this.currentFunctionReturnType) != null ? _b2 : void 0
          );
          funcSymbol.metadata.errorType = (_d = (_c = funcNode.errorType) != null ? _c : this.currentFunctionErrorType) != null ? _d : void 0;
          if (funcNode.body) {
            this.validateStmt(funcNode.body);
            const expectedReturnType = funcNode.returnType || this.currentFunctionReturnType;
            if (expectedReturnType && !expectedReturnType.isVoid()) {
              const hasErrorType = funcNode.errorType || this.currentFunctionErrorType;
              if (!this.hasReturnStatement) {
                if (!hasErrorType || !this.hasThrowStatement) {
                  this.reportError(
                    "MISSING_RETURN_STATEMENT",
                    `Function '${funcNode.ident.name}' with non-void return type must have at least one return statement`,
                    funcNode.ident.span
                  );
                }
              }
            }
            if (!funcNode.returnType) {
              if (this.currentFunctionReturnType) {
                funcSymbol.type.getFunction().returnType = this.currentFunctionReturnType;
              } else {
                funcSymbol.type.getFunction().returnType = TypeNode.asVoid(funcNode.span);
              }
            }
          }
        });
      });
      if (isInstanceMethod) {
        this.stats.memberAccessValidated++;
      }
    } finally {
      this.config.services.contextTracker.completeDeclaration(funcSymbol.id);
      this.currentIsStaticMethod = previousIsStaticMethod;
      this.currentStructScope = previousStructScope;
      this.currentFunctionReturnType = previousReturnType;
      this.hasReturnStatement = previousHasReturnStmt;
      this.currentFunctionErrorType = previousErrorType;
      this.hasThrowStatement = previousHasThrowStmt;
    }
    funcSymbol.isTypeChecked = true;
  }
  // ───── PARAMS ─────
  validateParameter(paramNode) {
    const paramSymbol = this.config.services.scopeManager.getSymbolInCurrentScope(paramNode.ident.name);
    if (!paramSymbol) return;
    if (paramNode.visibility.kind === "Static") {
      this.reportError(
        // Changed from reportWarning
        "INVALID_VISIBILITY",
        `Parameter '${paramNode.ident.name}' cannot be 'static'`,
        paramNode.ident.span
      );
      return;
    } else if (paramNode.visibility.kind === "Public") {
      this.reportError(
        // Changed from reportWarning
        "INVALID_VISIBILITY",
        `Parameter '${paramNode.ident.name}' cannot be 'public'`,
        paramNode.ident.span
      );
      return;
    }
    if (paramNode.initializer) {
      const initType = this.inferExpressionType(paramNode.initializer);
      if (initType) {
        if (!paramNode.type) {
          paramNode.type = initType;
          paramSymbol.type = initType;
          this.stats.typesInferred++;
        } else {
          if (!this.validateArrayAssignment(
            paramNode.type,
            initType,
            paramNode.initializer.span,
            `Parameter '${paramNode.ident.name}' default value`
          )) {
            paramSymbol.isTypeChecked = true;
            return;
          }
          if (!this.isTypeCompatible(paramNode.type, initType)) {
            this.reportError(
              "TYPE_MISMATCH",
              `Cannot assign type '${initType.toString()}' to parameter of type '${paramNode.type.toString()}'`,
              paramNode.initializer.span
            );
          }
        }
      }
      if (paramNode.type) {
        this.validateValueFitsInType(paramNode.initializer, paramNode.type);
      } else if (initType) {
        this.validateValueFitsInType(paramNode.initializer, initType);
      }
    }
    paramSymbol.isTypeChecked = true;
  }
  resolveSelfParameter(funcScope, structScope) {
    const selfSymbol = funcScope.symbols.get("self");
    if (!selfSymbol) {
      this.log("verbose", `Warning: Expected 'self' parameter in struct method but not found`);
      return;
    }
    selfSymbol.declared = true;
    selfSymbol.used = true;
    if (selfSymbol.type) {
      if (selfSymbol.type.kind === "ident") {
        const typeIdent = selfSymbol.type.getIdent();
        if (typeIdent.name !== structScope.name) {
          this.reportError(
            "TYPE_MISMATCH",
            `Self type mismatch: expected '${structScope.name}', got '${typeIdent.name}'`,
            selfSymbol.contextSpan
          );
        }
      }
    }
    this.log("symbols", `Resolved 'self' parameter in struct method`);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────────── [3.6] LOOP ─────────────────────────────┐
  handleLoopStmt(stmt, scope, moduleName) {
    if (stmt.getLoop === void 0) {
      const data = stmt;
      switch (stmt.kind) {
        case "While": {
          const src = data.source;
          const loop = LoopStmtNode.createWhile(data.span, src.expr, src.stmt);
          this.validateLoopStmt(loop);
          break;
        }
        case "Do": {
          const src = data.source;
          const loop = LoopStmtNode.createDo(data.span, src.expr, src.stmt);
          this.validateLoopStmt(loop);
          break;
        }
        case "For": {
          const src = data.source;
          const loop = LoopStmtNode.createFor(data.span, src.expr, src.stmt);
          this.validateLoopStmt(loop);
          break;
        }
      }
    } else {
      this.validateLoopStmt(stmt.getLoop());
    }
  }
  validateLoopStmt(loopStmt) {
    const loopScope = this.config.services.scopeManager.findChildScopeByName(
      "loop",
      "Loop"
      /* Loop */
    );
    if (!loopScope) return;
    this.config.services.contextTracker.withSavedState(() => {
      this.config.services.scopeManager.withScope(loopScope.id, () => {
        if (loopStmt.expr) {
          const condType = this.inferExpressionType(loopStmt.expr);
          if (loopStmt.kind === "While" && condType && !condType.isBool()) {
            this.log("verbose", `Loop condition has type ${condType.toString()}, not bool`);
          }
        }
        if (loopStmt.stmt) {
          this.validateStmt(loopStmt.stmt);
        }
      });
    });
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────── [3.7] CTRLFLOW ──────────────────────────┐
  handleControlflowStmt(stmt, scope, moduleName) {
    if (stmt.getCtrlflow === void 0) {
      const data = stmt;
      switch (stmt.kind) {
        case "Return": {
          const src = data.source;
          const res = ControlFlowStmtNode.asReturn(data.span, src.value);
          this.validateReturnStmt(res);
          break;
        }
        case "Defer": {
          const src = data.source;
          const res = ControlFlowStmtNode.asDefer(data.span, src.value);
          this.validateDeferStmt(res);
          break;
        }
        case "Throw": {
          const src = data.source;
          const res = ControlFlowStmtNode.asThrow(data.span, src.value);
          this.validateThrowStmt(res);
          break;
        }
      }
    } else {
      switch (stmt.getCtrlflow().kind) {
        case "return": {
          this.validateReturnStmt(stmt.getCtrlflow());
          break;
        }
        case "defer": {
          this.validateDeferStmt(stmt.getCtrlflow());
          break;
        }
        case "throw": {
          this.validateThrowStmt(stmt.getCtrlflow());
          break;
        }
      }
    }
  }
  validateReturnStmt(returnNode) {
    var _a;
    this.log("symbols", "Validating return statement");
    this.stats.returnsValidated++;
    this.hasReturnStatement = true;
    const isInFunction = this.isInsideFunctionScope();
    if (returnNode.value) {
      const isConstructor = this.isConstructorExpression(returnNode.value);
      if (!isConstructor && this.isTypeExpression(returnNode.value)) {
        const functionReturnsType = this.currentFunctionReturnType && this.isTypeType(this.currentFunctionReturnType);
        if (!functionReturnsType) {
          this.reportError(
            "TYPE_MISMATCH",
            `Cannot return a type as a value. Expected a value of type '${((_a = this.currentFunctionReturnType) == null ? void 0 : _a.toString()) || "void"}', got type expression`,
            returnNode.value.span
          );
          return;
        }
      }
      this.log("verbose", `Inferring return expression type: ${returnNode.value.kind}`);
      const returnType = this.inferExpressionType(returnNode.value);
      this.log("verbose", `Return type inferred: ${(returnType == null ? void 0 : returnType.toString()) || "null"}`);
      if (!returnType && this.config.services.diagnosticManager.hasErrors()) {
        this.log("verbose", "Type inference failed with errors, aborting return validation");
        return;
      }
      if (isInFunction && this.currentFunctionReturnType) {
        if (returnType && !this.isTypeCompatible(this.currentFunctionReturnType, returnType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `Return type '${returnType.toString()}' doesn't match function return type '${this.currentFunctionReturnType.toString()}'`,
            returnNode.value.span
          );
        }
      } else if (!isInFunction) {
        this.reportError(
          "ANALYSIS_ERROR",
          `Return statement outside of function`,
          returnNode.span
        );
      }
    } else {
      if (isInFunction && this.currentFunctionReturnType && !this.currentFunctionReturnType.isVoid()) {
        this.reportError(
          "TYPE_MISMATCH",
          `Function expects return type '${this.currentFunctionReturnType.toString()}' but got void return`,
          returnNode.span
        );
      } else if (!isInFunction) {
        this.reportError(
          "ANALYSIS_ERROR",
          `Return statement outside of function`,
          returnNode.span
        );
      }
    }
  }
  // ✅ Helper to detect constructor expressions
  isConstructorExpression(expr) {
    if (!expr.is("Primary")) return false;
    const primary = expr.getPrimary();
    if (!(primary == null ? void 0 : primary.is("Object"))) return false;
    const obj = primary.getObject();
    return (obj == null ? void 0 : obj.ident) !== null && (obj == null ? void 0 : obj.ident) !== void 0;
  }
  validateDeferStmt(deferNode) {
    const isInFunction = this.isInsideFunctionScope();
    if (deferNode.value) {
      this.inferExpressionType(deferNode.value);
    }
    if (!isInFunction) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Defer statement outside of function`,
        deferNode.span
      );
    }
  }
  validateThrowStmt(throwNode) {
    this.log("symbols", "Validating throw statement");
    this.hasThrowStatement = true;
    const isInFunction = this.isInsideFunctionScope();
    if (!isInFunction) {
      this.reportError(
        "ANALYSIS_ERROR",
        `Throw statement outside of function`,
        throwNode.span
      );
      return;
    }
    const functionErrorType = this.getCurrentFunctionErrorType();
    if (!functionErrorType) {
      this.reportError(
        "THROW_WITHOUT_ERROR_TYPE",
        `Cannot throw error in function without error type. Add '!ErrorType' to function signature`,
        throwNode.span
      );
      return;
    }
    if (throwNode.value) {
      const thrownType = this.inferExpressionType(throwNode.value);
      if (!thrownType) {
        this.reportError(
          "TYPE_INFERENCE_FAILED",
          `Cannot infer type of thrown expression`,
          throwNode.value.span
        );
        return;
      }
      this.validateThrowType(thrownType, functionErrorType, throwNode.value.span);
    } else {
      this.reportError(
        "ANALYSIS_ERROR",
        `Throw statement must have an error value`,
        throwNode.span
      );
    }
  }
  validateThrowType(thrownType, functionErrorType, span) {
    if (this.isAnyErrorType(functionErrorType)) {
      if (!this.isErrorType(thrownType)) {
        this.reportError(
          "TYPE_MISMATCH",
          `Cannot throw non-error type '${thrownType.toString()}'. Expected error type`,
          span
        );
      }
      return;
    }
    const resolvedFunctionError = this.resolveIdentifierType(functionErrorType);
    const resolvedThrownType = this.resolveIdentifierType(thrownType);
    if (!this.isValidThrowType(resolvedThrownType, resolvedFunctionError, span)) {
      this.reportError(
        "THROW_TYPE_MISMATCH",
        `Thrown error type '${thrownType.toString()}' is not compatible with function error type '${functionErrorType.toString()}'`,
        span
      );
    }
  }
  getCurrentFunctionErrorType() {
    const isInFunction = this.isInsideFunctionScope();
    if (isInFunction && this.currentFunctionErrorType) {
      return this.currentFunctionErrorType;
    }
    {
      let currentScope = this.config.services.scopeManager.getCurrentScope();
      while (currentScope && currentScope.kind !== "Function") {
        const parent = this.config.services.scopeManager.getScopeParent(currentScope.id);
        if (!parent) break;
        currentScope = parent;
      }
      if (!currentScope || currentScope.kind !== "Function") {
        return null;
      }
      const parentScope = this.config.services.scopeManager.getScopeParent(currentScope.id);
      if (!parentScope) return null;
      const funcSymbol = parentScope.symbols.get(currentScope.name);
      if (!funcSymbol || !funcSymbol.type || !funcSymbol.type.isFunction()) {
        return null;
      }
      const funcType = funcSymbol.type.getFunction();
      return funcType.errorType || null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [4] EXPR Level ───────────────────────────┐
  inferExpressionType(expr) {
    if (!expr) return null;
    const cacheKey = this.createCacheKey(expr);
    if (this.inferenceStack.has(cacheKey)) {
      this.log("verbose", `Circular type inference detected for ${cacheKey}`);
      return null;
    }
    this.inferenceStack.add(cacheKey);
    try {
      const inferredType = this.performTypeInference(expr);
      if (inferredType) {
        this.cacheType(cacheKey, inferredType);
        this.stats.typesInferred++;
      }
      return inferredType;
    } finally {
      this.inferenceStack.delete(cacheKey);
    }
  }
  performTypeInference(expr) {
    this.config.services.contextTracker.pushContextSpan(expr.span);
    try {
      switch (expr.kind) {
        case "Primary":
          return this.inferPrimaryType(expr.getPrimary());
        case "Binary":
          return this.inferBinaryType(expr.getBinary());
        case "Prefix":
          return this.inferPrefixType(expr.getPrefix());
        case "Postfix":
          return this.inferPostfixType(expr.getPostfix());
        case "As":
          return this.inferAsType(expr.getAs());
        case "Typeof": {
          const typeofNode = expr.getTypeof();
          const innerType = this.inferExpressionType(typeofNode.expr);
          if (!innerType) {
            this.reportError(
              "TYPE_INFERENCE_FAILED",
              "Cannot infer type for typeof expression",
              typeofNode.expr.span
            );
            return null;
          }
          return TypeNode.asPrimitive(expr.span, "type");
        }
        case "Sizeof": {
          const sizeofNode = expr.getSizeof();
          const targetType = this.inferExpressionType(sizeofNode.expr);
          if (!targetType) {
            this.reportError(
              "TYPE_INFERENCE_FAILED",
              "Cannot infer type for sizeof expression",
              sizeofNode.expr.span
            );
            return null;
          }
          const size = this.computeTypeSize(targetType);
          if (size === null) {
            this.reportError(
              "INVALID_SIZEOF_TARGET",
              `Cannot compute size of type '${targetType.toString()}'`,
              sizeofNode.expr.span
            );
            return TypeNode.asComptimeInt(expr.span, "0");
          }
          return TypeNode.asComptimeInt(expr.span, size.toString());
        }
        case "Orelse":
          return this.inferOrelseType(expr.getOrelse());
        case "Range":
          return this.inferRangeType(expr.getRange());
        case "Try":
          return this.inferTryType(expr.getTry());
        case "Catch":
          return this.inferCatchType(expr.getCatch());
        case "If":
          return this.inferIfType(expr.getIf());
        case "Switch":
          return this.inferSwitchType(expr.getSwitch());
        default:
          return null;
      }
    } finally {
      this.config.services.contextTracker.popContextSpan();
    }
  }
  computeTypeSize(type) {
    const resolved = this.resolveIdentifierType(type);
    return this.ExpressionEvaluator.computeTypeSize(resolved);
  }
  resolveTypeNode(typeNode) {
    switch (typeNode.kind) {
      case "struct":
        const tempSymbol = {
          id: -1,
          name: "<struct-validation>",
          kind: "Definition",
          type: typeNode,
          scope: this.config.services.scopeManager.getCurrentScope().id,
          contextSpan: typeNode.span,
          declared: true,
          initialized: true,
          used: false,
          isTypeChecked: false,
          visibility: { kind: "Private" },
          mutability: { kind: "Immutable" },
          isExported: false
        };
        this.validateStructType(typeNode.getStruct(), tempSymbol);
        break;
      case "enum":
        const tempSymbol2 = {
          id: -1,
          name: "<enum-validation>",
          kind: "Definition",
          type: typeNode,
          scope: this.config.services.scopeManager.getCurrentScope().id,
          contextSpan: typeNode.span,
          declared: true,
          initialized: true,
          used: false,
          isTypeChecked: false,
          visibility: { kind: "Private" },
          mutability: { kind: "Immutable" },
          isExported: false
        };
        this.validateEnumType(typeNode.getEnum(), tempSymbol2);
        break;
      case "array":
        const arr = typeNode.getArray();
        this.resolveTypeNode(arr.target);
        if (arr.size) {
          this.validateArraySize(arr.size);
        }
        break;
      case "optional":
        this.resolveTypeNode(typeNode.getOptional().target);
        break;
      case "pointer":
        this.resolveTypeNode(typeNode.getPointer().target);
        break;
      case "paren":
        this.resolveTypeNode(typeNode.getParen().type);
        break;
      case "tuple":
        for (const field of typeNode.getTuple().fields) {
          this.resolveTypeNode(field);
        }
        break;
      case "primitive": {
        const src = typeNode.getPrimitive();
        if (src.isSigned() || src.isUnsigned()) {
          const width = src.width;
          if (width < 0 || width > 65535) {
            this.reportError("INVALID_TYPE_WIDTH", `Type width must be from 0 to 65535`, typeNode.span);
          }
        }
      }
    }
  }
  // ✅ Helper method to check if expression is a type (not a value)
  isTypeExpression(expr) {
    if (expr.kind === "Primary") {
      const primary = expr.getPrimary();
      if (!primary) return false;
      if (primary.kind === "Object") {
        const obj = primary.getObject();
        if (obj && obj.ident) {
          return false;
        }
        return false;
      }
      if (primary.kind === "Type") {
        return true;
      }
      if (primary.kind === "Ident") {
        const ident = primary.getIdent();
        if (!ident) return false;
        const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
        if (symbol && symbol.kind === "Definition") {
          return true;
        }
      }
    }
    return false;
  }
  // ✅ Check if expression is the 'type' type
  isTypeType(typeNode) {
    if (!typeNode.isPrimitive()) return false;
    const prim = typeNode.getPrimitive();
    return (prim == null ? void 0 : prim.kind) === "type";
  }
  // ===== PRIMARY OPERATIONS =====
  inferPrimaryType(primary) {
    switch (primary.kind) {
      case "Literal":
        return this.inferLiteralType(primary.getLiteral());
      case "Ident":
        return this.inferIdentifierType(primary.getIdent());
      case "Paren":
        const paren = primary.getParen();
        return paren.source ? this.inferExpressionType(paren.source) : null;
      case "Tuple":
        return this.inferTupleType(primary.getTuple());
      case "Object":
        return this.inferObjectType(primary.getObject());
      case "Type":
        return primary.getType();
      default:
        return null;
    }
  }
  inferLiteralType(literal) {
    switch (literal.kind) {
      case "String":
        const str = literal.value;
        const sizeExpr = ExprNode.asInteger(literal.span, str.length);
        return TypeNode.asArray(literal.span, TypeNode.asUnsigned(literal.span, "u8", 8), sizeExpr);
      case "Integer":
        return TypeNode.asComptimeInt(literal.span, literal.value);
      case "Float":
        return TypeNode.asComptimeFloat(literal.span, literal.value);
      case "Character":
        return TypeNode.asUnsigned(literal.span, "u8", 8);
      case "Bool":
        return TypeNode.asBool(literal.span);
      case "Null":
        return TypeNode.asNull(literal.span);
      case "Undefined":
        return TypeNode.asUndefined(literal.span);
      case "Array":
        return this.inferArrayLiteralType(literal);
      default:
        return TypeNode.asUndefined(literal.span);
    }
  }
  inferArrayLiteralType(literal) {
    const elements = literal.value;
    if (elements.length === 0) {
      const sizeExpr2 = ExprNode.asInteger(literal.span, 0);
      return TypeNode.asArray(literal.span, TypeNode.asUndefined(literal.span), sizeExpr2);
    }
    const firstType = this.inferExpressionType(elements[0]);
    if (!firstType) {
      const sizeExpr2 = ExprNode.asInteger(literal.span, elements.length);
      return TypeNode.asArray(literal.span, TypeNode.asUndefined(literal.span), sizeExpr2);
    }
    for (let i = 1; i < elements.length; i++) {
      const elemType = this.inferExpressionType(elements[i]);
      if (!elemType || !this.isTypeCompatible(firstType, elemType)) {
        this.reportError(
          "TYPE_MISMATCH",
          "Array elements have incompatible types",
          elements[i].span
        );
      }
    }
    const sizeExpr = ExprNode.asInteger(literal.span, elements.length);
    return TypeNode.asArray(literal.span, firstType, sizeExpr);
  }
  inferIdentifierType(ident) {
    var _a, _b;
    if (ident.name === "self") {
      const selfSymbol = this.config.services.scopeManager.lookupSymbol("self");
      if (selfSymbol && ((_a = selfSymbol.metadata) == null ? void 0 : _a.isSelf)) {
        selfSymbol.used = true;
        return selfSymbol.type;
      }
    }
    if (this.currentIsStaticMethod && this.currentStructScope) {
      const fieldSymbol = this.currentStructScope.symbols.get(ident.name);
      if (fieldSymbol) {
        if (fieldSymbol.kind === "StructField" || fieldSymbol.kind === "Function") {
          const isStatic = fieldSymbol.visibility.kind === "Static";
          if (!isStatic) {
            const memberType = fieldSymbol.kind === "Function" ? "method" : "field";
            this.reportError(
              "INVALID_STATIC_ACCESS",
              `Cannot access instance ${memberType} '${ident.name}' in static method. Static methods can only access static ${memberType}s.`,
              ident.span
            );
            return null;
          }
          fieldSymbol.used = true;
        }
      }
    }
    const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
    if (!symbol) return null;
    if (ident.name === "self" && ((_b = symbol.metadata) == null ? void 0 : _b.isSelf)) {
      symbol.used = true;
      return symbol.type;
    }
    if (symbol.type) return symbol.type;
    if (symbol.kind === "Function" && symbol.metadata) {
      const metadata = symbol.metadata;
      const paramTypes = [];
      if (metadata.params && Array.isArray(metadata.params)) {
        for (const param of metadata.params) {
          if (param.type) {
            paramTypes.push(param.type);
          }
        }
      }
      const returnType = metadata.returnType || null;
      const funcType = TypeNode.asFunction(
        symbol.contextSpan || ident.span,
        paramTypes,
        returnType
      );
      symbol.type = funcType;
      return funcType;
    }
    return null;
  }
  validateMethodCallContext(call, methodSymbol, isStaticAccess, baseExpr) {
    const isStaticMethod = methodSymbol.visibility.kind === "Static";
    if (isStaticAccess && !isStaticMethod) {
      this.reportError(
        "INVALID_STATIC_ACCESS",
        `Cannot call instance method '${methodSymbol.name}' on type. Create an instance first.`,
        call.span
      );
      return;
    }
    if (!isStaticAccess && isStaticMethod) {
      return;
    }
  }
  inferObjectType(obj) {
    if (obj.ident) {
      const typeSymbol = this.config.services.scopeManager.lookupSymbol(obj.ident.name);
      if (!typeSymbol) {
        this.reportError(
          "UNDEFINED_IDENTIFIER",
          `Type '${obj.ident.name}' not found`,
          obj.span
        );
        return null;
      }
      if (!typeSymbol.type) {
        this.reportError(
          "SYMBOL_NOT_FOUND",
          `Symbol '${obj.ident.name}' has no type`,
          obj.span
        );
        return null;
      }
      let actualType = typeSymbol.type;
      if (actualType.isIdent()) {
        const typeIdent = actualType.getIdent();
        const resolvedSymbol = this.config.services.scopeManager.lookupSymbol(typeIdent.name);
        if (resolvedSymbol && resolvedSymbol.type) {
          actualType = resolvedSymbol.type;
        }
      }
      if (actualType.isStruct()) {
        this.validateStructConstruction(obj, actualType, obj.span);
        return typeSymbol.type;
      } else {
        this.reportError(
          "TYPE_MISMATCH",
          `'${obj.ident.name}' is not a struct type`,
          obj.span
        );
        return null;
      }
    }
    const fields = [];
    const fieldNodes = [];
    for (const prop of obj.props) {
      const fieldType = prop.val ? this.inferExpressionType(prop.val) : TypeNode.asUndefined(prop.key.span);
      if (!fieldType) {
        this.reportError(
          "CANNOT_INFER_TYPE",
          `Cannot infer type for property '${prop.key.name}'`,
          prop.key.span
        );
        return null;
      }
      fields.push(fieldType);
      const fieldNode = FieldNode.create(
        prop.key.span,
        { kind: "Private" },
        { kind: "Runtime" },
        { kind: "Immutable" },
        prop.key,
        fieldType,
        prop.val || void 0
      );
      fieldNodes.push(fieldNode);
    }
    const members = fieldNodes.map((f) => StructMemberNode.createField(f.span, f));
    return TypeNode.asStruct(obj.span, members, "Anonymous");
  }
  inferTupleType(tuple) {
    const fieldTypes = [];
    for (const field of tuple.fields) {
      const fieldType = this.inferExpressionType(field);
      if (!fieldType) return null;
      fieldTypes.push(fieldType);
    }
    return TypeNode.asTuple(tuple.span, fieldTypes);
  }
  // ===== BINARY OPERATIONS =====
  inferBinaryType(binary) {
    if (!binary.left || !binary.right) return null;
    if (binary.kind === "Assignment") {
      this.validateAssignment(binary);
      return this.inferExpressionType(binary.right);
    }
    const leftType = this.inferExpressionType(binary.left);
    const rightType = this.inferExpressionType(binary.right);
    if (!leftType || !rightType) return null;
    if (this.isTypeType(leftType) || this.isTypeType(rightType)) {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot perform ${binary.kind} operation on type values`,
        binary.span
      );
      return null;
    }
    switch (binary.kind) {
      case "Additive":
      case "Multiplicative":
      case "Power":
        if (!this.isNumericType(leftType) || !this.isNumericType(rightType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `Cannot perform ${binary.kind} operation on non-numeric types '${leftType.toString()}' and '${rightType.toString()}'`,
            binary.span
          );
          return null;
        }
        return this.promoteNumericTypes(leftType, rightType, binary.span);
      case "Shift":
      case "BitwiseAnd":
      case "BitwiseXor":
      case "BitwiseOr":
        if (!this.isIntegerType(leftType) || !this.isIntegerType(rightType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `Bitwise operations require integer types, got '${leftType.toString()}' and '${rightType.toString()}'`,
            binary.span
          );
          return null;
        }
        return this.promoteNumericTypes(leftType, rightType, binary.span);
      case "Equality":
      case "Relational":
        return TypeNode.asBool(binary.span);
      case "LogicalAnd":
      case "LogicalOr":
        return TypeNode.asBool(binary.span);
      default:
        return null;
    }
  }
  validateAssignment(binary) {
    if (binary.kind !== "Assignment") return;
    this.stats.assignmentsValidated++;
    const leftSymbol = this.extractSymbolFromExpression(binary.left);
    if (leftSymbol) {
      if (leftSymbol.mutability.kind === "Immutable") {
        let symbolType = "variable";
        if (leftSymbol.kind === "Parameter") {
          symbolType = "parameter";
        } else if (leftSymbol.kind === "StructField") {
          symbolType = "field";
        }
        this.reportError(
          "MUTABILITY_MISMATCH",
          `Cannot assign to immutable ${symbolType} '${leftSymbol.name}'`,
          binary.left.span
        );
        return;
      }
    }
    const leftType = this.inferExpressionType(binary.left);
    const rightType = this.inferExpressionType(binary.right);
    if (leftType && rightType && !this.isTypeCompatible(leftType, rightType)) {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot assign type '${rightType.toString()}' to '${leftType.toString()}'`,
        binary.right.span
      );
    }
    if (leftType) {
      this.validateValueFitsInType(binary.right, leftType);
    }
  }
  resolveStructFieldSymbol(structType, fieldName) {
    var _a;
    const struct = structType.getStruct();
    const scopeId = (_a = struct.metadata) == null ? void 0 : _a.scopeId;
    if (scopeId !== void 0) {
      try {
        const typeScope = this.config.services.scopeManager.getScope(scopeId);
        return typeScope.symbols.get(fieldName) || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  // ===== PREFIX OPERATIONS =====
  inferPrefixType(prefix) {
    const exprType = this.inferExpressionType(prefix.expr);
    if (!exprType) return null;
    switch (prefix.kind) {
      case "UnaryPlus":
      case "UnaryMinus":
        if (!this.isNumericType(exprType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `Unary '${prefix.kind === "UnaryMinus" ? "-" : "+"}' requires a numeric operand, got '${exprType.toString()}'`,
            prefix.expr.span
          );
          return null;
        }
        return this.computeUnaryResultType(exprType, prefix.kind === "UnaryMinus", prefix.span);
      case "Increment":
      case "Decrement":
        if (!this.isNumericType(exprType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `${prefix.kind} requires a numeric operand`,
            prefix.expr.span
          );
          return null;
        }
        return exprType;
      case "LogicalNot":
        return TypeNode.asBool(prefix.span);
      case "BitwiseNot":
        if (!this.isIntegerType(exprType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `Bitwise not requires integer type, got '${exprType.toString()}'`,
            prefix.expr.span
          );
          return null;
        }
        return exprType;
      case "Reference":
        let isMutablePointer = false;
        if (prefix.expr.is("Primary")) {
          const primary = prefix.expr.getPrimary();
          if (primary == null ? void 0 : primary.is("Ident")) {
            const ident = primary.getIdent();
            if (ident) {
              const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
              if (symbol && symbol.mutability.kind === "Mutable") {
                isMutablePointer = true;
              }
            }
          }
        }
        return TypeNode.asPointer(prefix.span, exprType, isMutablePointer);
      default:
        return null;
    }
  }
  // ===== POSTFIX OPERATIONS =====
  inferPostfixType(postfix) {
    switch (postfix.kind) {
      case "Call":
        return this.inferCallType(postfix.getCall());
      case "ArrayAccess":
        return this.inferArrayAccessType(postfix.getArrayAccess());
      case "MemberAccess":
        return this.inferMemberAccessType(postfix.getMemberAccess());
      case "Increment":
      case "Decrement":
        const exprType = this.inferExpressionType(postfix.getAsExprNode());
        if (exprType && !this.isNumericType(exprType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `${postfix.kind} requires numeric type`,
            postfix.span
          );
          return null;
        }
        return exprType;
      case "Dereference":
        const ptrType = this.inferExpressionType(postfix.getAsExprNode());
        if (!ptrType) {
          this.reportError(
            "TYPE_INFERENCE_FAILED",
            "Cannot infer type for dereference operation",
            postfix.span
          );
          return null;
        }
        if (!ptrType.isPointer()) {
          this.reportError(
            "TYPE_MISMATCH",
            `Cannot dereference non-pointer type '${ptrType.toString()}'`,
            postfix.span
          );
          return null;
        }
        return ptrType.getPointer().target;
      default:
        return null;
    }
  }
  inferCallType(call) {
    var _a;
    this.stats.callsValidated++;
    if (this.isBuiltinFunction(call.base)) {
      return this.validateBuiltinCall(call);
    }
    if (call.base.is("Postfix")) {
      const postfix = call.base.getPostfix();
      if ((postfix == null ? void 0 : postfix.kind) === "MemberAccess") {
        const access = postfix.getMemberAccess();
        const baseType = this.inferExpressionType(access.base);
        if (baseType) {
          const resolvedBase = this.resolveIdentifierType(baseType);
          if (resolvedBase.isStruct()) {
            const memberName = this.extractMemberName(access.target);
            if (memberName) {
              const struct = resolvedBase.getStruct();
              const scopeId = (_a = struct.metadata) == null ? void 0 : _a.scopeId;
              if (scopeId !== void 0) {
                const structScope = this.config.services.scopeManager.getScope(scopeId);
                const methodSymbol = structScope.symbols.get(memberName);
                if (methodSymbol && methodSymbol.kind === "Function") {
                  const isStaticAccess = this.isStaticMemberAccess(access.base);
                  this.validateMethodCallContext(call, methodSymbol, isStaticAccess, access.base);
                  this.validateMemberVisibility(methodSymbol, structScope, access.target.span);
                }
              }
            }
            return this.validateStructMethodCall(call, access, resolvedBase);
          }
        }
      }
    }
    const calleeSymbol = this.findCallTargetSymbol(call.base);
    let calleeType = calleeSymbol ? calleeSymbol.type : this.inferExpressionType(call.base);
    if (!calleeType) {
      return null;
    }
    if (calleeType.isFunction()) {
      return this.validateCallArgumentsWithContext(call, calleeType);
    }
    this.reportError(
      "TYPE_MISMATCH",
      `Cannot call value of non-function type`,
      call.base.span
    );
    return null;
  }
  validateMemberVisibility(memberSymbol, structScope, accessSpan) {
    if (memberSymbol.visibility.kind === "Public") {
      return;
    }
    if (memberSymbol.visibility.kind === "Private") {
      const currentScope = this.config.services.scopeManager.getCurrentScope();
      let isInsideStruct = false;
      let checkScope = currentScope;
      while (checkScope) {
        if (checkScope.id === structScope.id) {
          isInsideStruct = true;
          break;
        }
        if (checkScope.parent !== null) {
          checkScope = this.config.services.scopeManager.getScope(checkScope.parent);
        } else {
          break;
        }
      }
      if (!isInsideStruct) {
        this.reportError(
          "SYMBOL_NOT_ACCESSIBLE",
          `Cannot access private ${memberSymbol.kind === "Function" ? "method" : "field"} '${memberSymbol.name}' from outside struct`,
          accessSpan
        );
      }
    }
  }
  validateBuiltinCall(call) {
    const builtinName = this.extractBuiltinName(call.base);
    if (!builtinName) {
      this.reportError(
        "INTERNAL_ERROR",
        "Failed to extract builtin name",
        call.base.span
      );
      return TypeNode.asVoid(call.span);
    }
    const globalScope = this.config.services.scopeManager.getGlobalScope();
    const builtinSymbol = globalScope.symbols.get(builtinName);
    if (!builtinSymbol || !builtinSymbol.type) {
      this.reportError(
        "UNDEFINED_BUILTIN",
        `Unknown builtin function '${builtinName}'`,
        call.base.span
      );
      return TypeNode.asVoid(call.span);
    }
    const funcType = builtinSymbol.type;
    if (!funcType.isFunction()) {
      this.reportError(
        "TYPE_MISMATCH",
        `'${builtinName}' is not callable`,
        call.base.span
      );
      return TypeNode.asVoid(call.span);
    }
    const func = funcType.getFunction();
    if (func.params.length !== call.args.length) {
      const code = func.params.length > call.args.length ? "TOO_FEW_ARGUMENTS" : "TOO_MANY_ARGUMENTS";
      this.reportError(
        code,
        `Builtin '${builtinName}' expects ${func.params.length} argument(s), but got ${call.args.length}`,
        call.args.length ? { start: call.args[0].span.start, end: call.args[call.args.length - 1].span.end } : call.span
      );
      return func.returnType || TypeNode.asVoid(call.span);
    }
    for (let i = 0; i < func.params.length; i++) {
      const paramType = func.params[i];
      const arg = call.args[i];
      const argType = this.inferExpressionType(arg);
      if (!argType) continue;
      if (!this.isTypeCompatible(paramType, argType)) {
        this.reportError(
          "TYPE_MISMATCH",
          `Argument type '${argType.toString()}' is not compatible with parameter type '${paramType.toString()}'`,
          arg.span
        );
      }
    }
    return func.returnType || TypeNode.asVoid(call.span);
  }
  validateStructMethodCall(call, access, structType) {
    var _a;
    const methodName = this.extractMemberName(access.target);
    if (!methodName) return null;
    const struct = structType.getStruct();
    const scopeId = (_a = struct.metadata) == null ? void 0 : _a.scopeId;
    if (scopeId === void 0) {
      this.reportError(
        "INTERNAL_ERROR",
        `Cannot find scope for struct method call`,
        call.span
      );
      return null;
    }
    const structScope = this.config.services.scopeManager.getScope(scopeId);
    const methodSymbol = structScope.symbols.get(methodName);
    if (!methodSymbol || methodSymbol.kind !== "Function") {
      this.reportError(
        "SYMBOL_NOT_FOUND",
        `Method '${methodName}' not found in struct`,
        access.target.span
      );
      return null;
    }
    if (!methodSymbol.type || !methodSymbol.type.isFunction()) {
      this.reportError(
        "TYPE_MISMATCH",
        `'${methodName}' is not a callable method`,
        call.span
      );
      return null;
    }
    return this.validateMethodCall(call, methodSymbol, structScope, access.base);
  }
  validateCallArgumentsWithContext(call, funcType) {
    const func = funcType.getFunction();
    if (func.params.length !== call.args.length) {
      const code = func.params.length > call.args.length ? "TOO_FEW_ARGUMENTS" : "TOO_MANY_ARGUMENTS";
      this.reportError(
        code,
        `Expected ${func.params.length} arguments, but got ${call.args.length}`,
        call.span
      );
      return null;
    }
    for (let i = 0; i < func.params.length; i++) {
      const paramType = func.params[i];
      const arg = call.args[i];
      let argType = this.inferExpressionTypeWithContext(arg, paramType);
      if (!argType) {
        this.reportError(
          "TYPE_INFERENCE_FAILED",
          `Cannot infer type for argument ${i + 1}`,
          arg.span
        );
        continue;
      }
      if (!this.isTypeCompatible(paramType, argType)) {
        this.reportError(
          "TYPE_MISMATCH",
          `Argument type '${argType.toString()}' is not assignable to parameter type '${paramType.toString()}'`,
          arg.span
        );
      }
    }
    return func.returnType || TypeNode.asVoid(call.span);
  }
  inferExpressionTypeWithContext(expr, expectedType) {
    if (expectedType && expr.is("Primary")) {
      const primary = expr.getPrimary();
      if (primary && primary.is("Object")) {
        const obj = primary.getObject();
        if (!obj.ident) {
          const resolvedExpected = this.resolveIdentifierType(expectedType);
          if (resolvedExpected.isStruct()) {
            this.validateStructConstruction(obj, resolvedExpected, expr.span);
            return expectedType;
          }
        }
      }
    }
    return this.inferExpressionType(expr);
  }
  inferArrayAccessType(access) {
    const baseType = this.inferExpressionType(access.base);
    const indexType = this.inferExpressionType(access.index);
    if (!baseType) return null;
    if (indexType && !this.isIntegerType(indexType)) {
      this.reportError(
        "TYPE_MISMATCH",
        `Array index must be integer type, got '${indexType.toString()}'`,
        access.index.span
      );
    }
    if (baseType.isArray()) {
      return baseType.getArray().target;
    }
    if (this.isStringType(baseType)) {
      return TypeNode.asUnsigned(access.span, "u8", 8);
    }
    this.reportError(
      "TYPE_MISMATCH",
      `Cannot index non-array type '${baseType.toString()}'`,
      access.base.span
    );
    return null;
  }
  inferMemberAccessType(access) {
    var _a, _b, _c;
    this.log("verbose", `inferMemberAccessType: currentIsStaticMethod=${this.currentIsStaticMethod}, currentStructScope=${((_a = this.currentStructScope) == null ? void 0 : _a.name) || "null"}`);
    if (access.base.is("Primary")) {
      const primary = access.base.getPrimary();
      if (primary == null ? void 0 : primary.is("Ident")) {
        const ident = primary.getIdent();
        if ((ident == null ? void 0 : ident.name) === "self") {
          if (this.currentIsStaticMethod && this.currentStructScope) {
            const memberName = this.extractMemberName(access.target);
            if (!memberName) {
              this.reportError("INTERNAL_ERROR", `Could not resolve member access on self`, access.target.span);
              return null;
            }
            const memberSymbol = this.currentStructScope.symbols.get(memberName);
            if (!memberSymbol) {
              this.reportError("SYMBOL_NOT_FOUND", `Member '${memberName}' not found in struct`, access.target.span);
              return null;
            }
            const isStaticMember = memberSymbol.visibility.kind === "Static";
            if (!isStaticMember) {
              const memberType2 = memberSymbol.kind === "Function" ? "method" : "field";
              this.reportError(
                "INVALID_STATIC_ACCESS",
                `Cannot access instance ${memberType2} '${memberName}' via 'self' in static method. Static methods can only access static members.`,
                access.target.span
              );
              return null;
            }
            memberSymbol.used = true;
            return memberSymbol.type || null;
          }
          const selfSymbol = this.config.services.scopeManager.lookupSymbol("self");
          if (selfSymbol && ((_b = selfSymbol.metadata) == null ? void 0 : _b.isSelf)) {
            selfSymbol.used = true;
            const selfType = selfSymbol.type;
            if (selfType) {
              return this.resolveMemberOnUnwrappedType(selfType, access, null, false);
            }
          }
          return null;
        }
        const baseSymbol = this.config.services.scopeManager.lookupSymbol(ident.name);
        if (baseSymbol && baseSymbol.kind === "Use" && ((_c = baseSymbol.metadata) == null ? void 0 : _c.isWildcardImport)) {
          return this.resolveWildcardMemberAccess(access, baseSymbol);
        }
      }
    }
    let baseType = this.inferExpressionType(access.base);
    if (!baseType) {
      return null;
    }
    if (access.base.is("Postfix")) {
      const postfix = access.base.getPostfix();
      if ((postfix == null ? void 0 : postfix.kind) === "Dereference") {
        if (baseType.isIdent()) {
          const ident = baseType.getIdent();
          const typeSymbol = this.config.services.scopeManager.lookupSymbol(ident.name);
          if (typeSymbol == null ? void 0 : typeSymbol.type) {
            baseType = typeSymbol.type;
          }
        }
        return this.resolveMemberOnUnwrappedType(baseType, access, null);
      }
    }
    let unwrappedType = baseType;
    let optionalDepth = 0;
    while (unwrappedType.isOptional()) {
      unwrappedType = unwrappedType.getOptional().target;
      optionalDepth++;
    }
    if (unwrappedType.isIdent()) {
      const ident = unwrappedType.getIdent();
      const typeSymbol = this.config.services.scopeManager.lookupSymbol(ident.name);
      if (typeSymbol == null ? void 0 : typeSymbol.type) {
        unwrappedType = typeSymbol.type;
      }
    }
    const isStaticAccess = this.isStaticMemberAccess(access.base);
    const memberType = this.resolveMemberOnUnwrappedType(
      unwrappedType,
      access,
      null,
      isStaticAccess
    );
    if (optionalDepth > 0 && memberType) {
      return TypeNode.asOptional(access.span, memberType);
    }
    return memberType;
  }
  resolveWildcardMemberAccess(access, wildcardSymbol) {
    const memberName = this.extractMemberName(access.target);
    if (!memberName) {
      this.reportError(
        "INTERNAL_ERROR",
        `Cannot extract member name from wildcard access`,
        access.target.span
      );
      return null;
    }
    const targetModuleName = wildcardSymbol.importSource;
    if (!targetModuleName) {
      this.reportError(
        "INTERNAL_ERROR",
        `Wildcard import has no source module`,
        access.span
      );
      return null;
    }
    const targetModuleScope = this.findModuleScope(targetModuleName);
    if (!targetModuleScope) {
      this.reportError(
        "MODULE_SCOPE_NOT_FOUND",
        `Cannot find scope for module '${targetModuleName}'`,
        access.span
      );
      return null;
    }
    const memberSymbol = targetModuleScope.symbols.get(memberName);
    if (!memberSymbol) {
      this.reportError(
        "SYMBOL_NOT_FOUND",
        `Module '${targetModuleName}' has no exported symbol '${memberName}'`,
        access.target.span
      );
      return null;
    }
    if (!memberSymbol.isExported) {
      this.reportError(
        "SYMBOL_NOT_EXPORTED",
        `Symbol '${memberName}' is not exported from module '${targetModuleName}'`,
        access.target.span
      );
      return null;
    }
    memberSymbol.used = true;
    wildcardSymbol.used = true;
    return memberSymbol.type;
  }
  getFunctionNode(methodName, structScope) {
    var _a;
    const methodSymbol = structScope.symbols.get(methodName);
    if (!methodSymbol || methodSymbol.kind !== "Function") {
      return null;
    }
    return ((_a = methodSymbol.metadata) == null ? void 0 : _a.funcNode) || null;
  }
  // ✅ Detect if base is a type identifier (for static access)
  isStaticMemberAccess(baseExpr) {
    if (!baseExpr.is("Primary")) return false;
    const primary = baseExpr.getPrimary();
    if (!(primary == null ? void 0 : primary.is("Ident"))) return false;
    const ident = primary.getIdent();
    if (!ident) return false;
    const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
    return (symbol == null ? void 0 : symbol.kind) === "Definition";
  }
  // ✅ Add static flag parameter
  resolveMemberOnUnwrappedType(type, access, symbol, isStaticAccess = false) {
    if (type.isStruct()) {
      return this.resolveStructMember(type, access, symbol || null, isStaticAccess);
    }
    if (type.isEnum()) {
      return this.resolveEnumMember(type, access);
    }
    if (type.isErrset()) {
      return this.resolveEnumMember(type, access);
    }
    if (type.isOptional()) {
      const inner = type.getOptional().target;
      const result = this.resolveMemberOnUnwrappedType(inner, access, symbol, isStaticAccess);
      return result ? TypeNode.asOptional(access.span, result) : null;
    }
    return null;
  }
  // ✅ Enhanced struct member resolution with static checks
  resolveStructMember(structType, access, baseSymbol, isStaticAccess = false) {
    var _a;
    const struct = structType.getStruct();
    const memberName = this.extractMemberName(access.target);
    if (!memberName) return null;
    let structScope = null;
    if (((_a = struct.metadata) == null ? void 0 : _a.scopeId) !== void 0) {
      try {
        structScope = this.config.services.scopeManager.getScope(struct.metadata.scopeId);
      } catch (e) {
        structScope = null;
      }
    }
    if (!structScope && struct.name && struct.name !== "Anonymous") {
      const currentScope = this.config.services.scopeManager.getCurrentScope();
      structScope = this.config.services.scopeManager.findChildScopeByNameFromId(
        struct.name,
        currentScope.id,
        "Type"
        /* Type */
      );
      if (!structScope) {
        structScope = this.config.services.scopeManager.findScopeByName(
          struct.name,
          "Type"
          /* Type */
        );
      }
    }
    if (!structScope) {
      this.reportError(
        "SYMBOL_NOT_FOUND",
        `Cannot find scope for struct type`,
        access.base.span
      );
      return null;
    }
    const memberSymbol = structScope.symbols.get(memberName);
    if (!memberSymbol) {
      this.reportError(
        "SYMBOL_NOT_FOUND",
        `Struct has no member '${memberName}'`,
        access.target.span
      );
      return null;
    }
    if (memberSymbol.visibility.kind === "Private") {
      this.reportError(
        "SYMBOL_NOT_ACCESSIBLE",
        `Cannot access private ${memberSymbol.kind === "Function" ? "method" : "field"} '${memberName}' from outside struct`,
        access.target.span
      );
      return null;
    }
    const isStaticField = memberSymbol.visibility.kind === "Static";
    if (isStaticAccess && !isStaticField && memberSymbol.kind === "StructField") {
      this.reportError(
        "INVALID_STATIC_ACCESS",
        `Cannot access instance field '${memberName}' on type. Use an instance instead.`,
        access.target.span
      );
      return null;
    }
    if (!isStaticAccess && isStaticField && memberSymbol.kind === "StructField") {
      this.reportError(
        "INVALID_STATIC_ACCESS",
        `Cannot access static field '${memberName}' on instance. Use '${struct.name}.${memberName}' instead.`,
        access.target.span
      );
      return null;
    }
    return memberSymbol.type || null;
  }
  validateMethodCall(call, methodSymbol, structScope, baseExpr) {
    var _a;
    this.log("symbols", `Validating method call '${methodSymbol.name}' on struct instance`);
    if (!methodSymbol.type || !methodSymbol.type.isFunction()) {
      this.reportError(
        "TYPE_MISMATCH",
        `'${methodSymbol.name}' is not a callable method`,
        call.span
      );
      return null;
    }
    const funcType = methodSymbol.type.getFunction();
    if (funcType.params.length !== call.args.length) {
      const code = funcType.params.length > call.args.length ? "TOO_FEW_ARGUMENTS" : "TOO_MANY_ARGUMENTS";
      this.reportError(
        code,
        `Expected ${funcType.params.length} arguments, but got ${call.args.length}`,
        call.span
      );
      return null;
    }
    for (let i = 0; i < funcType.params.length; i++) {
      const paramType = funcType.params[i];
      const arg = call.args[i];
      const argType = this.inferExpressionTypeWithContext(arg, paramType);
      if (!argType || !this.isTypeCompatible(paramType, argType)) {
        this.reportError(
          "TYPE_MISMATCH",
          `Argument type '${(_a = argType == null ? void 0 : argType.toString()) != null ? _a : "unknown"}' is not assignable to parameter type '${paramType.toString()}'`,
          arg.span
        );
      }
    }
    return funcType.returnType || TypeNode.asVoid(call.span);
  }
  resolveEnumMember(enumType, access) {
    const memberName = this.extractMemberName(access.target);
    if (!memberName) return null;
    if (enumType.isEnum()) {
      const enumDef = enumType.getEnum();
      for (const variant of enumDef.variants) {
        if (variant.ident.name === memberName) {
          return variant.type || enumType;
        }
      }
    }
    if (enumType.isErrset()) {
      const errorType = enumType.getError();
      for (const member of errorType.members) {
        if (member.name === memberName) {
          return TypeNode.asIdentifier(member.span, member.name);
        }
      }
    }
    this.reportError(
      "SYMBOL_NOT_FOUND",
      `${enumType.isErrset() ? "Error set" : "enum"} has no variant '${memberName}'`,
      access.target.span
    );
    return null;
  }
  // ===== SPECIAL EXPRESSIONS =====
  inferAsType(asNode) {
    const sourceType = this.inferExpressionType(asNode.base);
    if (!sourceType) return null;
    if (!this.canConvertTypes(sourceType, asNode.type)) {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot convert type '${sourceType.toString()}' to type '${asNode.type.toString()}'`,
        asNode.span
      );
    }
    return asNode.type;
  }
  inferOrelseType(orelse) {
    const leftType = this.inferExpressionType(orelse.left);
    const rightType = this.inferExpressionType(orelse.right);
    if (!leftType) return rightType;
    if (!rightType) return leftType;
    if (leftType.isOptional()) {
      const unwrapped = leftType.getOptional().target;
      if (rightType.isNull()) {
        const result = TypeNode.asUnion(orelse.span, [unwrapped, rightType]);
        return result;
      }
      return unwrapped;
    }
    return leftType;
  }
  inferRangeType(range) {
    if (range.leftExpr) {
      const leftType = this.inferExpressionType(range.leftExpr);
      if (leftType && !this.isIntegerType(leftType)) {
        this.reportError(
          "TYPE_MISMATCH",
          `Range start must be integer type, got '${leftType.toString()}'`,
          range.leftExpr.span
        );
      }
    }
    if (range.rightExpr) {
      const rightType = this.inferExpressionType(range.rightExpr);
      if (rightType && !this.isIntegerType(rightType)) {
        this.reportError(
          "TYPE_MISMATCH",
          `Range end must be integer type, got '${rightType.toString()}'`,
          range.rightExpr.span
        );
      }
    }
    return null;
  }
  inferTryType(tryNode) {
    const exprType = this.inferExpressionType(tryNode.expr);
    if (!exprType) return null;
    return exprType;
  }
  inferCatchType(catchNode) {
    const leftType = this.inferExpressionType(catchNode.leftExpr);
    const exprScope = this.config.services.scopeManager.findChildScopeByName(
      "expr",
      "Expression"
      /* Expression */
    );
    if (exprScope) {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.scopeManager.withScope(exprScope.id, () => {
          this.validateStmt(catchNode.rightStmt);
        });
      });
    }
    return leftType;
  }
  inferIfType(ifNode) {
    const condType = this.inferExpressionType(ifNode.condExpr);
    if (condType && !condType.isBool()) {
      this.log("verbose", `If condition has type ${condType.toString()}, expected bool`);
    }
    const exprScope = this.config.services.scopeManager.findChildScopeByName(
      "expr",
      "Expression"
      /* Expression */
    );
    if (exprScope) {
      this.config.services.contextTracker.withSavedState(() => {
        this.config.services.scopeManager.withScope(exprScope.id, () => {
          this.validateStmt(ifNode.thenStmt);
          if (ifNode.elseStmt) {
            this.validateStmt(ifNode.elseStmt);
          }
        });
      });
    } else {
      this.validateStmt(ifNode.thenStmt);
      if (ifNode.elseStmt) {
        this.validateStmt(ifNode.elseStmt);
      }
    }
    return null;
  }
  inferSwitchType(switchNode) {
    this.inferExpressionType(switchNode.condExpr);
    this.validateSwitchExhaustiveness(switchNode);
    const exprScope = this.config.services.scopeManager.findChildScopeByName(
      "expr",
      "Expression"
      /* Expression */
    );
    for (const switchCase of switchNode.cases) {
      if (switchCase.expr) {
        this.inferExpressionType(switchCase.expr);
      }
      if (switchCase.stmt) {
        if (exprScope) {
          this.config.services.contextTracker.withSavedState(() => {
            this.config.services.scopeManager.withScope(exprScope.id, () => {
              this.validateStmt(switchCase.stmt);
            });
          });
        } else {
          this.validateStmt(switchCase.stmt);
        }
      }
    }
    if (switchNode.defCase) {
      if (exprScope) {
        this.config.services.contextTracker.withSavedState(() => {
          this.config.services.scopeManager.withScope(exprScope.id, () => {
            this.validateStmt(switchNode.defCase.stmt);
          });
        });
      } else {
        this.validateStmt(switchNode.defCase.stmt);
      }
    }
    return null;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [5] Ident Level ──────────────────────────┐
  resolveIdentifierType(type) {
    if (!type.isIdent()) return type;
    const ident = type.getIdent();
    if (ident.builtin) return type;
    const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
    if (symbol && symbol.type) {
      return this.resolveIdentifierType(symbol.type);
    }
    return type;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────── [6] Type Level ───────────────────────────┐
  validateStructType(structType, symbol) {
    var _a;
    let typeScope = null;
    if (((_a = structType.metadata) == null ? void 0 : _a.scopeId) !== void 0) {
      try {
        typeScope = this.config.services.scopeManager.getScope(structType.metadata.scopeId);
      } catch (e) {
        typeScope = null;
      }
    }
    if (!typeScope && structType.name && structType.name !== "Anonymous") {
      typeScope = this.config.services.scopeManager.findScopeByName(
        structType.name,
        "Type"
        /* Type */
      );
    }
    if (!typeScope) {
      typeScope = this.config.services.scopeManager.findChildScopeByNameFromId(
        symbol.name,
        symbol.scope,
        "Type"
        /* Type */
      );
    }
    if (!typeScope) {
      this.reportError(
        "INTERNAL_ERROR",
        `Cannot find type scope for struct validation`,
        structType.span
      );
      return;
    }
    this.config.services.contextTracker.withSavedState(() => {
      this.config.services.scopeManager.withScope(typeScope.id, () => {
        for (const member of structType.members) {
          if (member.isField()) {
            const field = member.getField();
            if (field.visibility.kind === "Static" && field.mutability.kind === "Mutable") {
              this.reportError(
                // Changed from reportWarning
                "INVALID_VISIBILITY",
                `Struct field '${field.ident.name}' cannot be 'static'`,
                field.span
              );
              continue;
            }
            if (field.type) {
              this.resolveTypeNode(field.type);
            }
            if (field.initializer) {
              const initType = this.inferExpressionType(field.initializer);
              if (field.type && initType) {
                if (!this.validateArrayAssignment(
                  field.type,
                  initType,
                  field.initializer.span,
                  `Field '${field.ident.name}' initializer`
                )) {
                  continue;
                }
                if (!this.isTypeCompatible(field.type, initType)) {
                  this.reportError(
                    "TYPE_MISMATCH",
                    `Field '${field.ident.name}' initializer type '${initType.toString()}' doesn't match field type '${field.type.toString()}'`,
                    field.initializer.span
                  );
                }
              } else if (!field.type && initType) {
                field.type = initType;
              }
              if (field.type) {
                this.validateValueFitsInType(field.initializer, field.type);
              } else if (initType) {
                this.validateValueFitsInType(field.initializer, initType);
              }
            }
          } else {
            const method = member.getMethod();
            this.validateFuncStmt(method);
          }
        }
      });
    });
  }
  validateStructConstruction(objNode, structType, initSpan) {
    if (!structType.isStruct()) {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot initialize non-struct type with object literal`,
        initSpan
      );
      return false;
    }
    const struct = structType.getStruct();
    if (objNode.ident) {
      const constructorName = objNode.ident.name;
      const expectedName = struct.name || this.extractTypeName(structType);
      if (expectedName && constructorName !== expectedName) {
        this.reportError(
          "TYPE_MISMATCH",
          `Constructor '${constructorName}' does not match expected type '${expectedName}'`,
          objNode.ident.span
        );
        return false;
      }
    }
    const structFields = /* @__PURE__ */ new Map();
    for (const member of struct.members) {
      if (member.isField()) {
        const field = member.source;
        structFields.set(field.ident.name, field);
      }
    }
    const providedFields = /* @__PURE__ */ new Set();
    for (const prop of objNode.props) {
      const fieldName = prop.key.name;
      providedFields.add(fieldName);
      const structField = structFields.get(fieldName);
      if (!structField) {
        this.reportError(
          "SYMBOL_NOT_FOUND",
          `Struct '${struct.name || "<anonymous>"}' has no field '${fieldName}'`,
          prop.key.span
        );
        continue;
      }
      if (structField.visibility.kind === "Static") {
        this.reportError(
          "INVALID_STATIC_ACCESS",
          `Cannot initialize static field '${fieldName}' in constructor. Static fields belong to the type, not instances.`,
          prop.key.span
        );
        continue;
      }
      if (prop.val && structField.type) {
        const valueType = this.inferExpressionType(prop.val);
        if (valueType && !this.isTypeCompatible(structField.type, valueType)) {
          this.reportError(
            "TYPE_MISMATCH",
            `Field '${fieldName}' expects type '${structField.type.toString()}' but got '${valueType.toString()}'`,
            prop.val.span
          );
        }
      }
    }
    let hasMissingFields = false;
    for (const [fieldName, field] of structFields) {
      if (field.visibility.kind === "Static") {
        continue;
      }
      if (!providedFields.has(fieldName) && !field.initializer) {
        this.reportError(
          "TYPE_MISMATCH",
          `Missing required field '${fieldName}' in struct initialization`,
          initSpan
        );
        hasMissingFields = true;
      }
    }
    return !hasMissingFields;
  }
  validateEnumType(enumType, symbol) {
    const typeScope = this.config.services.scopeManager.findChildScopeByName(
      symbol.name,
      "Type"
      /* Type */
    );
    if (!typeScope) return;
    this.config.services.contextTracker.withSavedState(() => {
      this.config.services.scopeManager.withScope(typeScope.id, () => {
        for (const variant of enumType.variants) {
          if (variant.type) {
            this.resolveTypeNode(variant.type);
          }
        }
      });
    });
  }
  validateArraySize(sizeExpr) {
    const errorCountBefore = this.config.services.diagnosticManager.length();
    const comptimeValue = this.ExpressionEvaluator.evaluateComptimeExpression(sizeExpr);
    const errorCountAfter = this.config.services.diagnosticManager.length();
    const evaluationFailed = errorCountAfter > errorCountBefore;
    if (evaluationFailed) {
      return;
    }
    if (comptimeValue === null) {
      this.reportError(
        "TYPE_MISMATCH",
        "Array size must be a compile-time constant expression",
        sizeExpr.span
      );
      return;
    }
    if (comptimeValue <= BigInt(0)) {
      this.reportError(
        "TYPE_MISMATCH",
        `Array size must be positive, got ${comptimeValue}`,
        sizeExpr.span
      );
      return;
    }
    const MAX_ARRAY_SIZE = BigInt(2147483647);
    if (comptimeValue > MAX_ARRAY_SIZE) {
      this.reportError(
        "TYPE_MISMATCH",
        `Array size ${comptimeValue} exceeds maximum allowed size ${MAX_ARRAY_SIZE}`,
        sizeExpr.span
      );
      return;
    }
  }
  validateSwitchExhaustiveness(switchNode) {
    const condType = this.inferExpressionType(switchNode.condExpr);
    if (!condType) return;
    let resolvedType = condType;
    if (condType.isIdent()) {
      const ident = condType.getIdent();
      const typeSymbol = this.config.services.scopeManager.lookupSymbol(ident.name);
      if (typeSymbol && typeSymbol.type) {
        resolvedType = typeSymbol.type;
      }
    }
    if (resolvedType.isEnum()) {
      const enumType = resolvedType.getEnum();
      const coveredVariants = /* @__PURE__ */ new Set();
      for (const switchCase of switchNode.cases) {
        if (switchCase.expr) {
          const variantName = this.extractEnumVariantName(switchCase.expr);
          if (variantName) {
            coveredVariants.add(variantName);
          }
        }
      }
      if (!switchNode.defCase) {
        const missingVariants = [];
        for (const variant of enumType.variants) {
          if (!coveredVariants.has(variant.ident.name)) {
            missingVariants.push(variant.ident.name);
          }
        }
        if (missingVariants.length > 0) {
          this.reportError(
            "TYPE_MISMATCH",
            `Switch is not exhaustive. Missing variants: ${missingVariants.join(", ")}`,
            switchNode.span
          );
        }
      }
    }
    if (resolvedType.isBool()) {
      const hasTrue = switchNode.cases.some((c) => this.isBoolLiteral(c.expr, true));
      const hasFalse = switchNode.cases.some((c) => this.isBoolLiteral(c.expr, false));
      if (!switchNode.defCase && (!hasTrue || !hasFalse)) {
        this.reportError(
          "TYPE_MISMATCH",
          "Switch on boolean must handle both true and false cases or have a default",
          switchNode.span
        );
      }
    }
  }
  validateArrayAssignment(declaredType, initType, initSpan, contextName) {
    if (!declaredType.isArray() || !initType.isArray()) {
      return true;
    }
    const targetArray = declaredType.getArray();
    const sourceArray = initType.getArray();
    if (!targetArray.size || !sourceArray.size) {
      return true;
    }
    const targetSize = this.ExpressionEvaluator.extractIntegerValue(targetArray.size);
    const sourceSize = this.ExpressionEvaluator.extractIntegerValue(sourceArray.size);
    if (targetSize === void 0 || sourceSize === void 0) {
      return true;
    }
    if (targetSize !== sourceSize) {
      const msg = sourceSize > targetSize ? `Array literal has more elements than the fixed array type` : `Array literal has fewer elements than the fixed array type`;
      this.reportError(
        "ARRAY_SIZE_MISMATCH",
        `${msg}`,
        initSpan
      );
      return false;
    }
    return true;
  }
  checkCircularTypeDependency(typeNode, typeName, allowIndirection = false, pathHasIndirection = false) {
    const key = `${typeName}:${typeNode.kind}:${typeNode.span.start}`;
    if (this.circularTypeDetectionStack.has(key)) {
      if (!pathHasIndirection) {
        this.reportError(
          "TYPE_MISMATCH",
          `Circular type dependency detected for '${typeName}'. Use pointer or optional to break the cycle.`,
          typeNode.span
        );
        return true;
      }
      return false;
    }
    this.circularTypeDetectionStack.add(key);
    try {
      switch (typeNode.kind) {
        case "ident": {
          const ident = typeNode.getIdent();
          if (!ident.builtin && ident.name === typeName) {
            if (!pathHasIndirection) {
              this.reportError(
                "TYPE_MISMATCH",
                `Direct self-reference in type '${typeName}'. Use pointer or optional to break the cycle.`,
                typeNode.span
              );
              return true;
            }
            return false;
          }
          if (!ident.builtin) {
            const typeSymbol = this.config.services.scopeManager.lookupSymbol(ident.name);
            if (typeSymbol && typeSymbol.type && typeSymbol.kind === "Definition") {
              return this.checkCircularTypeDependency(
                typeSymbol.type,
                typeName,
                allowIndirection,
                pathHasIndirection
              );
            }
          }
          break;
        }
        case "array":
          return this.checkCircularTypeDependency(
            typeNode.getArray().target,
            typeName,
            allowIndirection,
            pathHasIndirection
          );
        case "optional":
        case "pointer":
          if (allowIndirection) {
            return false;
          }
          return this.checkCircularTypeDependency(
            typeNode.kind === "optional" ? typeNode.getOptional().target : typeNode.getPointer().target,
            typeName,
            allowIndirection,
            true
          );
        case "tuple":
          for (const field of typeNode.getTuple().fields) {
            if (this.checkCircularTypeDependency(
              field,
              typeName,
              allowIndirection,
              pathHasIndirection
            )) {
              return true;
            }
          }
          break;
        case "struct": {
          const struct = typeNode.getStruct();
          for (const member of struct.members) {
            if (member.isField()) {
              const field = member.source;
              if (field.type && this.checkCircularTypeDependency(
                field.type,
                typeName,
                allowIndirection,
                pathHasIndirection
              )) {
                return true;
              }
            }
          }
          break;
        }
        case "enum": {
          const enumType = typeNode.getEnum();
          for (const variant of enumType.variants) {
            if (variant.type && this.checkCircularTypeDependency(
              variant.type,
              typeName,
              allowIndirection,
              pathHasIndirection
            )) {
              return true;
            }
          }
          break;
        }
        case "union": {
          const unionType = typeNode.getUnion();
          for (const member of unionType.types) {
            if (this.checkCircularTypeDependency(
              member,
              typeName,
              allowIndirection,
              pathHasIndirection
            )) {
              return true;
            }
          }
          break;
        }
        case "paren": {
          return this.checkCircularTypeDependency(
            typeNode.getParen().type,
            typeName,
            allowIndirection,
            pathHasIndirection
          );
        }
      }
      return false;
    } finally {
      this.circularTypeDetectionStack.delete(key);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  isTypeCompatible(target, source) {
    this.stats.compatibilityChecks++;
    if (this.isAnyType(target)) return true;
    if (this.isAnyErrorType(target)) {
      if (this.isErrorType(source)) {
        return true;
      }
      if (source.isIdent()) {
        const sourceIdent = source.getIdent();
        const sourceSymbol = this.config.services.scopeManager.lookupSymbol(sourceIdent.name);
        if (sourceSymbol && sourceSymbol.kind === "Error") {
          return true;
        }
      }
      return false;
    }
    if (this.isSameType(target, source)) return true;
    const resolvedTarget = this.resolveIdentifierType(target);
    const resolvedSource = this.resolveIdentifierType(source);
    if (this.isSameType(resolvedTarget, resolvedSource)) return true;
    if (this.isAnyErrorType(resolvedTarget)) {
      if (this.isErrorType(resolvedSource)) {
        return true;
      }
      if (resolvedSource.isIdent()) {
        const ident = resolvedSource.getIdent();
        const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
        if (symbol && symbol.kind === "Error") {
          return true;
        }
      }
      return false;
    }
    if (resolvedSource.isBool() && this.isNumericType(resolvedTarget)) {
      return false;
    }
    if (this.isNumericType(resolvedTarget) && this.isNumericType(resolvedSource)) {
      return this.areNumericTypesCompatible(resolvedTarget, resolvedSource);
    }
    if (resolvedTarget.isUnion() && resolvedSource.isUnion()) {
      const targetUnion = resolvedTarget.getUnion();
      const sourceUnion = resolvedSource.getUnion();
      return sourceUnion.types.every(
        (sourceType) => targetUnion.types.some(
          (targetType) => this.isTypeCompatible(targetType, sourceType)
        )
      );
    }
    if (resolvedTarget.isOptional()) {
      if (resolvedSource.isNull() || resolvedSource.isUndefined()) return true;
      const targetInner = resolvedTarget.getOptional().target;
      return this.isTypeCompatible(targetInner, source);
    }
    if (resolvedTarget.isArray() && resolvedSource.isArray()) {
      return this.areArrayTypesCompatible(resolvedTarget, resolvedSource);
    }
    if (resolvedTarget.isPointer()) {
      if (resolvedSource.isNull()) return true;
      if (resolvedSource.isPointer()) {
        return this.arePointerTypesCompatible(resolvedTarget, resolvedSource);
      }
    }
    if (resolvedTarget.isTuple() && resolvedSource.isTuple()) {
      return this.areTupleTypesCompatible(resolvedTarget, resolvedSource);
    }
    if (resolvedTarget.isStruct() && resolvedSource.isStruct()) {
      return this.areStructTypesCompatible(resolvedTarget, resolvedSource);
    }
    if (resolvedTarget.isEnum() && resolvedSource.isEnum()) {
      return this.isSameType(resolvedTarget, resolvedSource);
    }
    if (resolvedTarget.isUnion()) {
      const unionType = resolvedTarget.getUnion();
      return unionType.types.some((type) => this.isTypeCompatible(type, source));
    }
    if (resolvedSource.isOptional()) {
      const sourceInner = resolvedSource.getOptional().target;
      if (resolvedTarget.isUnion()) {
        const unionType = resolvedTarget.getUnion();
        const hasInnerType = unionType.types.some(
          (t) => this.isTypeCompatible(t, sourceInner)
        );
        const hasNull = unionType.types.some((t) => t.isNull());
        return hasInnerType && hasNull;
      }
    }
    return false;
  }
  isNumericType(type) {
    if (this.isTypeType(type)) {
      return false;
    }
    return type.isFloat() || type.isSigned() || type.isUnsigned() || type.isComptimeInt() || type.isComptimeFloat();
  }
  isAnyType(type) {
    if (!type.isPrimitive()) return false;
    const prim = type.getPrimitive();
    return (prim == null ? void 0 : prim.kind) === "any";
  }
  isIntegerType(type) {
    return type.isSigned() || type.isUnsigned() || type.isComptimeInt();
  }
  isStringType(type) {
    if (!type.isArray()) return false;
    const arrayType = type.getArray();
    const elemType = arrayType.target;
    return elemType.isUnsigned() && elemType.getWidth() === 8;
  }
  isAnyErrorType(type) {
    if (!type.isPrimitive()) return false;
    const prim = type.getPrimitive();
    return (prim == null ? void 0 : prim.kind) === "err";
  }
  isErrorType(type) {
    if (type.isErrset()) {
      return true;
    }
    if (type.isIdent()) {
      const ident = type.getIdent();
      if (ident.name === "anyerror") {
        return true;
      }
      const symbol = this.config.services.scopeManager.lookupSymbol(ident.name);
      if (symbol) {
        if (symbol.kind === "Error") {
          return true;
        }
        if (symbol.type && symbol.type.isErrset()) {
          return true;
        }
      }
      const allScopes = this.config.services.scopeManager.getAllScopes();
      for (const scope of allScopes) {
        const scopeSymbol = scope.symbols.get(ident.name);
        if (scopeSymbol && scopeSymbol.kind === "Error") {
          return true;
        }
      }
    }
    return false;
  }
  isSameType(type1, type2) {
    if (type1 === type2) return true;
    if (type1.kind !== type2.kind) return false;
    switch (type1.kind) {
      case "primitive":
        const prim1 = type1.getPrimitive();
        const prim2 = type2.getPrimitive();
        return prim1.kind === prim2.kind && prim1.width === prim2.width;
      case "array":
        const arr1 = type1.getArray();
        const arr2 = type2.getArray();
        return this.isSameType(arr1.target, arr2.target);
      case "pointer":
        const ptr1 = type1.getPointer();
        const ptr2 = type2.getPointer();
        return this.isSameType(ptr1.target, ptr2.target) && ptr1.mutable === ptr2.mutable;
      case "paren":
        return this.isSameType(type1.getParen().type, type2.getParen().type);
      case "optional":
        const opt1 = type1.getOptional();
        const opt2 = type2.getOptional();
        return this.isSameType(opt1.target, opt2.target);
      case "tuple":
        const tup1 = type1.getTuple();
        const tup2 = type2.getTuple();
        if (tup1.fields.length !== tup2.fields.length) return false;
        return tup1.fields.every((f, i) => this.isSameType(f, tup2.fields[i]));
      case "function":
        const func1 = type1.getFunction();
        const func2 = type2.getFunction();
        if (func1.params.length !== func2.params.length) return false;
        if (!func1.params.every((p, i) => this.isSameType(p, func2.params[i]))) return false;
        const ret1 = func1.returnType;
        const ret2 = func2.returnType;
        if (ret1 && ret2) return this.isSameType(ret1, ret2);
        return ret1 === ret2;
      case "ident":
        const id1 = type1.getIdent();
        const id2 = type2.getIdent();
        return id1.name === id2.name;
      default:
        return false;
    }
  }
  promoteNumericTypes(type1, type2, span) {
    var _a, _b, _c, _d;
    if (type1.isComptimeInt() && this.isNumericType(type2)) return type2;
    if (type2.isComptimeInt() && this.isNumericType(type1)) return type1;
    if (type1.isComptimeFloat() && type2.isFloat()) return type2;
    if (type2.isComptimeFloat() && type1.isFloat()) return type1;
    if (type1.isFloat() || type2.isFloat()) {
      const width12 = (_a = type1.getWidth()) != null ? _a : 32;
      const width22 = (_b = type2.getWidth()) != null ? _b : 32;
      const maxWidth2 = Math.max(width12, width22);
      return TypeNode.asFloat(span, `f${maxWidth2}`, maxWidth2);
    }
    const width1 = (_c = type1.getWidth()) != null ? _c : 32;
    const width2 = (_d = type2.getWidth()) != null ? _d : 32;
    const maxWidth = Math.max(width1, width2);
    if (type1.isSigned() || type2.isSigned()) {
      return TypeNode.asSigned(span, `i${maxWidth}`, maxWidth);
    }
    return TypeNode.asUnsigned(span, `u${maxWidth}`, maxWidth);
  }
  computeUnaryResultType(operandType, isNegation, span) {
    var _a;
    if (operandType.isComptimeInt()) {
      const prim = operandType.getPrimitive();
      const txtStr = (prim == null ? void 0 : prim.text) !== void 0 ? String(prim.text) : "cint";
      const resultText = isNegation ? txtStr.startsWith("-") ? txtStr.slice(1) : `-${txtStr}` : txtStr;
      return TypeNode.asComptimeInt(span, resultText);
    }
    if (operandType.isUnsigned() && isNegation) {
      const width = (_a = operandType.getWidth()) != null ? _a : 32;
      return TypeNode.asSigned(span, `i${width}`, width);
    }
    return operandType;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  arePointerTypesCompatible(target, source) {
    const targetPtr = target.getPointer();
    const sourcePtr = source.getPointer();
    const baseCompatible = targetPtr.target.isOptional() ? this.isSameType(targetPtr.target.getOptional().target, sourcePtr.target) : this.isSameType(targetPtr.target, sourcePtr.target);
    if (!baseCompatible) {
      this.reportError(
        "TYPE_MISMATCH",
        `Cannot assign '${source.toString()}' to variable of type '${target.toString()}'`,
        source.span
      );
      return false;
    }
    if (targetPtr.mutable && !sourcePtr.mutable) {
      this.reportError(
        "MUTABILITY_MISMATCH",
        `Cannot assign immutable pointer to mutable pointer variable`,
        source.span
      );
      return false;
    }
    if (!this.isTypeCompatible(targetPtr.target, sourcePtr.target)) {
      return false;
    }
    if (targetPtr.mutable && !sourcePtr.mutable) {
      return false;
    }
    return true;
  }
  areTupleTypesCompatible(target, source) {
    const targetTuple = target.getTuple();
    const sourceTuple = source.getTuple();
    if (targetTuple.fields.length !== sourceTuple.fields.length) {
      return false;
    }
    for (let i = 0; i < targetTuple.fields.length; i++) {
      if (!this.isTypeCompatible(targetTuple.fields[i], sourceTuple.fields[i])) {
        return false;
      }
    }
    return true;
  }
  areStructTypesCompatible(target, source) {
    var _a, _b;
    const targetStruct = target.getStruct();
    const sourceStruct = source.getStruct();
    if (((_a = targetStruct.metadata) == null ? void 0 : _a.scopeId) !== void 0 && ((_b = sourceStruct.metadata) == null ? void 0 : _b.scopeId) !== void 0) {
      return targetStruct.metadata.scopeId === sourceStruct.metadata.scopeId;
    }
    if (targetStruct.name && targetStruct.name !== "Anonymous" && sourceStruct.name && sourceStruct.name !== "Anonymous") {
      return targetStruct.name === sourceStruct.name;
    }
    return this.areStructsStructurallyCompatible(targetStruct, sourceStruct);
  }
  areStructsStructurallyCompatible(target, source) {
    const targetFields = /* @__PURE__ */ new Map();
    const sourceFields = /* @__PURE__ */ new Map();
    for (const member of target.members) {
      if (member.isField()) {
        const field = member.source;
        targetFields.set(field.ident.name, field);
      }
    }
    for (const member of source.members) {
      if (member.isField()) {
        const field = member.source;
        sourceFields.set(field.ident.name, field);
      }
    }
    for (const [fieldName, targetField] of targetFields) {
      const sourceField = sourceFields.get(fieldName);
      if (!sourceField) {
        return false;
      }
      if (targetField.type && sourceField.type) {
        if (!this.isTypeCompatible(targetField.type, sourceField.type)) {
          return false;
        }
      }
    }
    return true;
  }
  areNumericTypesCompatible(target, source) {
    if (source.isBool() || target.isBool()) {
      return false;
    }
    if (source.isComptimeInt() && target.isUnsigned()) {
      const prim = source.getPrimitive();
      const txtStr = (prim == null ? void 0 : prim.text) !== void 0 ? String(prim.text) : "0";
      try {
        const value = BigInt(txtStr);
        if (value < BigInt(0)) {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    if (source.isComptimeInt() || source.isComptimeFloat()) {
      return true;
    }
    return true;
  }
  areArrayTypesCompatible(target, source) {
    const targetArray = target.getArray();
    const sourceArray = source.getArray();
    if (sourceArray.target.isUndefined()) {
      return true;
    }
    if (!this.isTypeCompatible(targetArray.target, sourceArray.target)) {
      return false;
    }
    if (targetArray.size && sourceArray.size) {
      const targetSize = this.ExpressionEvaluator.extractIntegerValue(targetArray.size);
      const sourceSize = this.ExpressionEvaluator.extractIntegerValue(sourceArray.size);
      if (targetSize !== void 0 && sourceSize !== void 0) {
        return targetSize === sourceSize;
      }
    }
    return true;
  }
  canConvertTypes(source, target) {
    if (source.isIdent()) {
      const sourceSymbol = this.config.services.scopeManager.lookupSymbol(source.getIdent().name);
      if (sourceSymbol && sourceSymbol.type) {
        source = sourceSymbol.type;
      } else {
        return false;
      }
    }
    if (target.isIdent()) {
      const targetSymbol = this.config.services.scopeManager.lookupSymbol(target.getIdent().name);
      if (targetSymbol && targetSymbol.type) {
        target = targetSymbol.type;
      } else {
        return false;
      }
    }
    if (this.isSameType(source, target)) return true;
    if (this.isNumericType(source) && this.isNumericType(target)) return true;
    if (source.isComptimeInt() && this.isNumericType(target)) return true;
    if (source.isComptimeFloat() && target.isFloat()) return true;
    if (source.isPointer() && target.isPointer()) return true;
    if (this.isIntegerType(source) && target.isPointer()) return true;
    if (source.isEnum() && this.isIntegerType(target)) return true;
    return false;
  }
  validateValueFitsInType(expr, targetType) {
    const value = this.ExpressionEvaluator.evaluateComptimeExpression(expr, targetType);
    if (value === null) {
      return;
    }
    const bounds = this.getTypeBounds(targetType);
    if (value < bounds.min || value > bounds.max) {
      this.reportError(
        "ARITHMETIC_OVERFLOW",
        `Value ${value} does not fit in type '${targetType.toString()}' (valid range: ${bounds.min} to ${bounds.max})`,
        expr.span
      );
    }
  }
  getTypeBounds(type) {
    if (type.isSigned()) {
      const width = type.getWidth() || 64;
      if (width === 64) {
        return {
          min: BigInt("-9223372036854775808"),
          max: BigInt("9223372036854775807")
        };
      }
      const max = BigInt(2) ** BigInt(width - 1) - BigInt(1);
      const min = -(BigInt(2) ** BigInt(width - 1));
      return { min, max };
    }
    if (type.isUnsigned()) {
      const width = type.getWidth() || 64;
      const max = BigInt(2) ** BigInt(width) - BigInt(1);
      return { min: BigInt(0), max };
    }
    return {
      min: BigInt("-9223372036854775808"),
      max: BigInt("9223372036854775807")
    };
  }
  isValidThrowType(thrownType, functionErrorType, span) {
    if (this.isSameType(thrownType, functionErrorType)) {
      return true;
    }
    if (functionErrorType.isErrset()) {
      const errorSet = functionErrorType.getError();
      if (thrownType.isIdent()) {
        const thrownIdent = thrownType.getIdent();
        const isMember = errorSet.members.some((member) => member.name === thrownIdent.name);
        if (isMember) {
          return true;
        }
      }
      return false;
    }
    if (functionErrorType.isIdent()) {
      const funcErrorIdent = functionErrorType.getIdent();
      const errorSymbol = this.config.services.scopeManager.lookupSymbol(funcErrorIdent.name);
      if (errorSymbol && errorSymbol.type && errorSymbol.type.isErrset()) {
        const errorSet = errorSymbol.type.getError();
        if (thrownType.isIdent()) {
          const thrownIdent = thrownType.getIdent();
          return errorSet.members.some((member) => member.name === thrownIdent.name);
        }
      }
    }
    if (thrownType.isIdent()) {
      const thrownIdent = thrownType.getIdent();
      const thrownSymbol = this.config.services.scopeManager.lookupSymbol(thrownIdent.name);
      if (thrownSymbol && thrownSymbol.kind === "Error") {
        if (this.isAnyErrorType(functionErrorType)) {
          return true;
        }
        return this.isErrorMemberOfType(thrownIdent.name, functionErrorType);
      }
    }
    return false;
  }
  isErrorMemberOfType(memberName, errorType) {
    const resolvedType = this.resolveIdentifierType(errorType);
    if (resolvedType.isErrset()) {
      const errorSet = resolvedType.getError();
      return errorSet.members.some((member) => member.name === memberName);
    }
    return false;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  extractTypeFromInitializer(expr) {
    if (expr.kind !== "Primary") return null;
    const primary = expr.getPrimary();
    if (!primary || primary.kind !== "Type") return null;
    return primary.getType();
  }
  extractSymbolFromExpression(expr) {
    if (expr.is("Primary")) {
      const primary = expr.getPrimary();
      if (primary == null ? void 0 : primary.is("Ident")) {
        const ident = primary.getIdent();
        if (ident) {
          return this.config.services.scopeManager.lookupSymbol(ident.name);
        }
      }
    }
    return null;
  }
  extractBuiltinName(expr) {
    if (expr.kind !== "Primary") return null;
    const primary = expr.getPrimary();
    if (!primary || primary.kind !== "Ident") return null;
    const ident = primary.getIdent();
    return ((ident == null ? void 0 : ident.name) ? "@" + ident.name : null) || null;
  }
  extractMemberName(memberExpr) {
    switch (memberExpr.kind) {
      case "Primary": {
        const src = memberExpr.getPrimary();
        if (src.kind === "Ident") {
          return src.getIdent().name;
        }
        return null;
      }
      case "Prefix": {
        const src = memberExpr.getPrefix();
        return this.extractMemberName(src.expr);
      }
      case "Postfix": {
        const src = memberExpr.getPostfix();
        switch (src.kind) {
          case "MemberAccess": {
            const access = src.getMemberAccess();
            return this.extractMemberName(access.target);
          }
          case "Call": {
            const call = src.getCall();
            return this.extractMemberName(call.base);
          }
          case "ArrayAccess": {
            const index = src.getArrayAccess();
            return this.extractMemberName(index.base);
          }
          case "Increment":
          case "Decrement":
          case "Dereference": {
            return this.extractMemberName(src.getAsExprNode());
          }
          default:
            return null;
        }
      }
      case "Binary":
      case "As":
      case "Orelse":
      case "Range":
      case "Try":
      case "Catch":
      case "If":
      case "Switch":
      case "Typeof":
      case "Sizeof":
        return null;
      default:
        this.log("verbose", `Cannot extract member name from expression kind: ${memberExpr.kind}`);
        return null;
    }
  }
  extractEnumVariantName(expr) {
    if (expr.is("Postfix")) {
      const postfix = expr.getPostfix();
      if ((postfix == null ? void 0 : postfix.kind) === "MemberAccess") {
        const access = postfix.getMemberAccess();
        return this.extractMemberName(access.target);
      }
    }
    return null;
  }
  extractTypeName(typeNode) {
    if (typeNode.isIdent()) {
      return typeNode.getIdent().name;
    }
    if (typeNode.isStruct()) {
      return typeNode.getStruct().name || null;
    }
    return null;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  findModuleScope(moduleName) {
    const moduleScope = this.config.services.scopeManager.findScopeByName(
      moduleName,
      "Module"
      /* Module */
    );
    if (!moduleScope) {
      this.reportError("MODULE_SCOPE_NOT_FOUND", `Module scope for '${moduleName}' not found`);
    }
    return moduleScope;
  }
  findCallTargetSymbol(baseExpr, objectScope) {
    var _a;
    if (baseExpr.kind === "Primary") {
      const primary = baseExpr.getPrimary();
      if (primary.kind === "Ident") {
        const ident = primary.getIdent();
        if (ident) {
          const s = objectScope ? this.config.services.scopeManager.lookupSymbolInScopeChain(ident.name, objectScope.id) : (_a = this.config.services.scopeManager.lookupSymbol(ident.name)) != null ? _a : void 0;
          return s != null ? s : void 0;
        }
      }
    }
    return void 0;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  isBuiltinFunction(baseExpr) {
    if (baseExpr.isIdent()) {
      const ident = baseExpr.getIdent();
      return (ident == null ? void 0 : ident.builtin) === true || (ident == null ? void 0 : ident.name.startsWith("@")) === true;
    }
    return false;
  }
  isInsideFunctionScope() {
    let currentScope = this.config.services.scopeManager.getCurrentScope();
    while (currentScope) {
      if (currentScope.kind === "Function") {
        return true;
      }
      if (currentScope.kind === "Module" || currentScope.kind === "Global") {
        return false;
      }
      if (currentScope.parent !== null) {
        try {
          currentScope = this.config.services.scopeManager.getScope(currentScope.parent);
        } catch (e) {
          return false;
        }
      } else {
        return false;
      }
    }
    return false;
  }
  isAccessibleFrom(targetScope) {
    const currentScope = this.config.services.scopeManager.getCurrentScope();
    let current = currentScope;
    let target = targetScope;
    while (current && current.kind !== "Module") {
      current = current.parent !== null ? this.config.services.scopeManager.getScope(current.parent) : null;
    }
    while (target && target.kind !== "Module") {
      target = target.parent !== null ? this.config.services.scopeManager.getScope(target.parent) : null;
    }
    return (current == null ? void 0 : current.id) === (target == null ? void 0 : target.id);
  }
  isBoolLiteral(expr, value) {
    if (!expr || !expr.is("Primary")) return false;
    const primary = expr.getPrimary();
    if (!(primary == null ? void 0 : primary.is("Literal"))) return false;
    const literal = primary.getLiteral();
    return (literal == null ? void 0 : literal.kind) === "Bool" && literal.value === value;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  createCacheKey(expr) {
    const moduleName = this.config.services.contextTracker.getModuleName() || "unknown";
    const span = expr.span || { start: 0, end: 0 };
    return `${moduleName}:${span.start}:${span.end}:${expr.kind}`;
  }
  cacheType(key, type) {
    if (this.typeCtx.typeCache.size >= this.CACHE_MAX_SIZE) {
      const entries = Array.from(this.typeCtx.typeCache.entries());
      const toKeep = entries.slice(-Math.floor(this.CACHE_MAX_SIZE / 2));
      this.typeCtx.typeCache.clear();
      toKeep.forEach(([k, v]) => this.typeCtx.typeCache.set(k, v));
    }
    this.typeCtx.typeCache.set(key, type || null);
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  init() {
    this.config.services.contextTracker.reset();
    this.config.services.contextTracker.setPhase(
      "TypeValidation"
      /* TypeValidation */
    );
    const globalScope = this.config.services.scopeManager.getGlobalScope();
    this.config.services.scopeManager.setCurrentScope(globalScope.id);
    this.config.services.contextTracker.setScope(globalScope.id);
    this.log("verbose", "Type validation initialized");
    return true;
  }
  initStats() {
    return {
      modulesProcessed: 0,
      typesInferred: 0,
      typesCached: 0,
      compatibilityChecks: 0,
      callsValidated: 0,
      memberAccessValidated: 0,
      assignmentsValidated: 0,
      returnsValidated: 0,
      errors: 0,
      startTime: Date.now()
    };
  }
  initTypeValidatorContext() {
    return {
      currentModule: "",
      moduleStack: [],
      typeCache: /* @__PURE__ */ new Map()
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  logStatistics() {
    const duration = Date.now() - this.stats.startTime;
    this.log(
      "verbose",
      `Type Validation Statistics :
  Duration                 : ${duration}ms
  Types inferred           : ${this.stats.typesInferred}
  Types cached             : ${this.stats.typesCached}
  Compatibility checks     : ${this.stats.compatibilityChecks}
  Calls validated          : ${this.stats.callsValidated}
  Member access validated  : ${this.stats.memberAccessValidated}
  Assignments validated    : ${this.stats.assignmentsValidated}
  Returns validated        : ${this.stats.returnsValidated}
  Cache size               : ${this.typeCtx.typeCache.size}
  Errors                   : ${this.stats.errors}`
    );
  }
  // └──────────────────────────────────────────────────────────────────────┘
};
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
var SemanticValidator = class extends PhaseBase {
  constructor(config) {
    super("SemanticValidation", config);
    this.stats = this.initStats();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  handle() {
    try {
      this.log("verbose", "Starting semantic validation phase...");
      this.stats.startTime = Date.now();
      this.validateEntryPoint();
      this.validateUnusedSymbols();
      this.validateModuleIntegrity();
      this.validateVisibilityRules();
      this.logStatistics();
      return !this.config.services.diagnosticManager.hasErrors();
    } catch (error) {
      this.log("errors", `Fatal error during semantic validation: ${error}`);
      this.reportError(
        "ANALYSIS_ERROR",
        `Semantic validation failed: ${error}`
      );
      return false;
    }
  }
  reset() {
    this.stats = this.initStats();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  validateEntryPoint() {
    var _a;
    this.log("symbols", "Validating entry point");
    this.stats.entryPointChecks++;
    const entryModuleName = (_a = this.config.program.metadata) == null ? void 0 : _a.entryModule;
    if (!entryModuleName) {
      this.log("verbose", "No entry module specified, skipping entry point validation");
      return;
    }
    const validation = this.performEntryPointValidation(entryModuleName);
    this.reportEntryPointErrors(validation, entryModuleName);
  }
  performEntryPointValidation(entryModuleName) {
    var _a;
    const result = {
      hasEntryModule: false,
      hasMainFunction: false,
      mainIsPublic: false,
      errors: []
    };
    const entryModule = this.config.program.modules.get(entryModuleName);
    if (!entryModule) {
      result.errors.push(`Entry module '${entryModuleName}' not found`);
      return result;
    }
    result.hasEntryModule = true;
    this.config.services.contextTracker.setModuleName(entryModuleName);
    if (typeof ((_a = entryModule.metadata) == null ? void 0 : _a.path) === "string") {
      this.config.services.contextTracker.setModulePath(entryModule.metadata.path);
    }
    const mainFunc = entryModule.findFunction("main");
    if (!mainFunc) {
      result.errors.push(`Entry module '${entryModuleName}' does not contain 'main' function`);
      return result;
    }
    result.hasMainFunction = true;
    if (mainFunc.visibility.kind !== "Public") {
      result.errors.push(`Main function in entry module '${entryModuleName}' must be public`);
      return result;
    }
    result.mainIsPublic = true;
    this.validateMainFunctionSignature(mainFunc, result);
    return result;
  }
  validateMainFunctionSignature(mainFunc, result) {
    if (mainFunc.parameters.length > 2) {
      result.errors.push(`Main function should not have more than 2 parameters`);
    }
    if (mainFunc.returnType && !this.isValidMainReturnType(mainFunc.returnType)) {
      result.errors.push(`Main function should return void or exit code type`);
    }
  }
  isValidMainReturnType(returnType) {
    return returnType.isVoid() || returnType.isSigned() && returnType.getWidth() === 32 || returnType.isUnsigned() && returnType.getWidth() === 8;
  }
  reportEntryPointErrors(validation, entryModuleName) {
    for (const error of validation.errors) {
      let code;
      if (error.includes("not found")) {
        code = "ENTRY_MODULE_NOT_FOUND";
      } else if (error.includes("does not contain")) {
        code = "ENTRY_MODULE_NO_MAIN";
      } else if (error.includes("must be public")) {
        code = "ENTRY_MODULE_PRIVATE_MAIN";
      } else {
        code = "ANALYSIS_ERROR";
      }
      this.reportError(code, error);
      this.stats.errors++;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  validateUnusedSymbols() {
    this.log("symbols", "Validating unused symbols");
    this.stats.unusedSymbolChecks++;
    const analysis = this.analyzeUnusedSymbols();
    this.reportUnusedSymbols(analysis);
  }
  analyzeUnusedSymbols() {
    const analysis = {
      unusedVariables: [],
      unusedParameters: [],
      unusedFunctions: [],
      totalUnused: 0
    };
    for (const symbol of this.config.services.scopeManager.getAllSymbols().values()) {
      if (!symbol.used && this.shouldCheckForUnused(symbol)) {
        switch (symbol.kind) {
          case "Variable":
            analysis.unusedVariables.push(symbol);
            break;
          case "Parameter":
            analysis.unusedParameters.push(symbol);
            break;
          case "Function":
            analysis.unusedFunctions.push(symbol);
            break;
        }
        analysis.totalUnused++;
      }
    }
    return analysis;
  }
  shouldCheckForUnused(symbol) {
    if (symbol.name.startsWith("_")) {
      return false;
    }
    if (symbol.visibility.kind === "Public") {
      return false;
    }
    if (symbol.name === "main" && symbol.kind === "Function") {
      return false;
    }
    if (symbol.name.startsWith("@")) {
      return false;
    }
    if (symbol.importSource) {
      return false;
    }
    return true;
  }
  reportUnusedSymbols(analysis) {
    for (const symbol of analysis.unusedVariables) {
      this.reportUnusedSymbol(symbol, "UNUSED_VARIABLE", "Variable");
    }
    for (const symbol of analysis.unusedParameters) {
      this.reportUnusedSymbol(symbol, "UNUSED_PARAMETER", "Parameter");
    }
    for (const symbol of analysis.unusedFunctions) {
      this.reportUnusedSymbol(symbol, "UNUSED_FUNCTION", "Function");
    }
    if (analysis.totalUnused > 0) {
      this.log(
        "verbose",
        `Found ${analysis.totalUnused} unused symbols: ${analysis.unusedVariables.length} variables, ${analysis.unusedParameters.length} parameters, ${analysis.unusedFunctions.length} functions`
      );
    }
  }
  reportUnusedSymbol(symbol, code, symbolType) {
    var _a;
    const prevModule = this.config.services.contextTracker.getModuleName();
    const prevPath = this.config.services.contextTracker.getModulePath();
    const prevSpan = this.config.services.contextTracker.getContextSpan();
    try {
      if (symbol.module) {
        this.config.services.contextTracker.setModuleName(symbol.module);
        const module = this.config.program.modules.get(symbol.module);
        if (module && typeof ((_a = module.metadata) == null ? void 0 : _a.path) === "string") {
          this.config.services.contextTracker.setModulePath(module.metadata.path);
        }
      }
      this.config.services.contextTracker.setCurrentContextSpan(symbol.contextSpan);
      if (symbol.kind === "Function") {
        const parentScope = this.config.services.scopeManager.getScope(symbol.scope);
        if (parentScope.kind === "Type") {
          if (symbol.visibility.kind === "Static") {
            return;
          }
        }
      }
      if (symbol.name === "self" && symbol.kind === "Parameter") {
        return;
      }
      this.config.services.diagnosticManager.push({
        code,
        kind: "warning",
        msg: `${symbolType} '${symbol.name}' is declared but never used`,
        targetSpan: symbol.targetSpan
      });
      this.stats.warnings++;
    } finally {
      this.config.services.contextTracker.setModuleName(prevModule);
      this.config.services.contextTracker.setModulePath(prevPath);
      this.config.services.contextTracker.setCurrentContextSpan(prevSpan);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  validateModuleIntegrity() {
    this.log("symbols", "Validating module integrity");
    this.stats.moduleIntegrityChecks++;
    for (const [moduleName, module] of this.config.program.modules) {
      this.validateSingleModuleIntegrity(moduleName, module);
    }
  }
  validateSingleModuleIntegrity(moduleName, module) {
    var _a, _b;
    const prevModule = this.config.services.contextTracker.getModuleName();
    const prevPath = this.config.services.contextTracker.getModulePath();
    const prevSpan = this.config.services.contextTracker.getContextSpan();
    try {
      this.config.services.contextTracker.setModuleName(moduleName);
      if (typeof ((_a = module.metadata) == null ? void 0 : _a.path) === "string") {
        this.config.services.contextTracker.setModulePath(module.metadata.path);
      }
      const moduleSpan = (_b = module.metadata) == null ? void 0 : _b.span;
      if (moduleSpan && typeof moduleSpan === "object" && "start" in moduleSpan && "end" in moduleSpan) {
        this.config.services.contextTracker.setCurrentContextSpan(moduleSpan);
      }
      if (module.statements.length === 0) {
        this.reportWarning(
          "ANALYSIS_ERROR",
          `Module '${moduleName}' is empty`
        );
        return;
      }
    } finally {
      this.config.services.contextTracker.setModuleName(prevModule);
      this.config.services.contextTracker.setModulePath(prevPath);
      this.config.services.contextTracker.setCurrentContextSpan(prevSpan);
    }
    this.checkCircularImports(moduleName, module);
    this.validateExportConsistency(moduleName, module);
  }
  checkCircularImports(moduleName, module) {
    const importedModules = /* @__PURE__ */ new Set();
    for (const stmt of module.statements) {
      if (stmt.kind === "Use") {
        const useNode = stmt.getUse();
        if (useNode.path) {
          const importedModule = this.findModuleByPath(useNode.path);
          if (importedModule) {
            importedModules.add(importedModule);
            if (this.hasCircularImport(moduleName, importedModule, /* @__PURE__ */ new Set())) {
              this.reportWarning(
                "IMPORT_CIRCULAR_DEPENDENCY",
                `Circular import detected between '${moduleName}' and '${importedModule}'`,
                useNode.span
              );
            }
          }
        }
      }
    }
  }
  hasCircularImport(originalModule, currentModule, visited) {
    if (visited.has(currentModule)) {
      return currentModule === originalModule;
    }
    visited.add(currentModule);
    const module = this.config.program.modules.get(currentModule);
    if (!module) return false;
    for (const stmt of module.statements) {
      if (stmt.kind === "Use") {
        const useNode = stmt.getUse();
        if (useNode.path) {
          const importedModule = this.findModuleByPath(useNode.path);
          if (importedModule === originalModule) {
            return true;
          }
          if (importedModule && this.hasCircularImport(originalModule, importedModule, new Set(visited))) {
            return true;
          }
        }
      }
    }
    return false;
  }
  validateExportConsistency(moduleName, module) {
    const moduleScope = this.config.services.scopeManager.findScopeByName(moduleName, "Module");
    if (!moduleScope) return;
    for (const [symbolName, symbol] of moduleScope.symbols) {
      if (symbol.visibility.kind === "Public" && !symbol.used) {
      }
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  validateVisibilityRules() {
    this.log("symbols", "Validating visibility rules");
    this.stats.visibilityChecks++;
    for (const symbol of this.config.services.scopeManager.getAllSymbols().values()) {
      this.validateSymbolVisibility(symbol);
    }
  }
  validateSymbolVisibility(symbol) {
    if (symbol.visibility.kind === "Private" && symbol.used) {
      this.validatePrivateSymbolUsage(symbol);
    }
    if (symbol.visibility.kind === "Public") {
      this.validatePublicSymbolExposure(symbol);
    }
  }
  validatePrivateSymbolUsage(symbol) {
  }
  validatePublicSymbolExposure(symbol) {
    if (!symbol.used && symbol.kind !== "Function") {
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  findModuleByPath(importPath) {
    var _a;
    for (const [name, module] of this.config.program.modules) {
      const modulePath = (_a = module.metadata) == null ? void 0 : _a.path;
      if (modulePath === importPath) {
        return name;
      }
    }
    return void 0;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  init() {
    this.config.services.contextTracker.reset();
    this.config.services.contextTracker.setPhase(
      "SemanticValidation"
      /* SemanticValidation */
    );
    this.log("verbose", "Semantic validation initialized");
    return true;
  }
  initStats() {
    return {
      entryPointChecks: 0,
      unusedSymbolChecks: 0,
      visibilityChecks: 0,
      moduleIntegrityChecks: 0,
      errors: 0,
      warnings: 0,
      startTime: Date.now()
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  logStatistics() {
    const duration = Date.now() - this.stats.startTime;
    this.log(
      "verbose",
      `Semantic Validation Statistics     :
  Duration                         : ${duration}ms
  Entry point checks               : ${this.stats.entryPointChecks}
  Unused symbol checks             : ${this.stats.unusedSymbolChecks}
  Visibility checks                : ${this.stats.visibilityChecks}
  Module integrity checks          : ${this.stats.moduleIntegrityChecks}
  Errors                           : ${this.stats.errors}
  Warnings                         : ${this.stats.warnings}`
    );
  }
  // └──────────────────────────────────────────────────────────────────────┘
};
var Analyzer = class _Analyzer {
  constructor(config = {}) {
    this.phaseTimings = /* @__PURE__ */ new Map();
    this.getDiagMgr = () => this.config.services.diagnosticManager;
    this.config = this.createConfig(config);
    this.symbolCollector = new SymbolCollector(this.config);
    this.symbolResolver = new SymbolResolver(this.config);
    this.typeValidator = new TypeValidator(this.config);
    this.semanticValidator = new SemanticValidator(this.config);
    this.log("verbose", `\u{1F680} Analyzer initialized with config: ${JSON.stringify(this.config)}`);
  }
  /** Factory method to create analyzer instance */
  static create(config) {
    return new _Analyzer(config);
  }
  log(kind = "verbose", message) {
    this.config.services.debugManager.log(kind, message);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────── MAIN ANALYSIS INTERFACE ───────────────────┐
  /**
   * Analyze a program through all configured phases
   * @param program The AST program to analyze
   * @param config Optional runtime configuration overrides
   * @returns Analysis result with diagnostics and metadata
   */
  analyze(program, config) {
    const startTime = Date.now();
    this.log("verbose", "\u{1F50D} Starting multi-phase analysis...");
    try {
      const effectiveConfig = __spreadValues2(__spreadValues2({}, this.config), config);
      if (!this.validateProgramStructure(program)) {
        return this.createErrorResult(
          "Invalid program structure",
          "Collection"
          /* Collection */
        );
      }
      this.config.program = program;
      const phases = [
        { phase: "Collection", executor: () => this.executePhase1() },
        { phase: "Resolution", executor: () => this.executePhase2() },
        { phase: "TypeValidation", executor: () => this.executePhase3() },
        { phase: "SemanticValidation", executor: () => this.executePhase4() }
      ];
      let completedPhase = "Collection";
      let shouldContinue = true;
      for (const { phase, executor } of phases) {
        if (!shouldContinue || this.shouldStopAtPhase(phase, effectiveConfig.stopAtPhase)) {
          break;
        }
        const phaseResult = this.runPhase(phase, executor);
        completedPhase = phase;
        if (!phaseResult.success) {
          if (effectiveConfig.strictMode) {
            this.log("errors", `\u274C Stopping analysis at phase ${phase} due to errors (strict mode)`);
            shouldContinue = false;
          }
        }
        if (this.config.services.diagnosticManager.length() >= effectiveConfig.maxErrors) {
          this.log("errors", `\u26A0\uFE0F Stopping analysis due to error limit (${effectiveConfig.maxErrors})`);
          shouldContinue = false;
        }
      }
      const totalTime = Date.now() - startTime;
      const result = this.createFinalResult(completedPhase, totalTime);
      this.log(
        "verbose",
        `\u2705 Analysis completed in ${totalTime}ms
   Success: ${result.success}
   Errors: ${result.diagnostics.filter((d) => d.kind === "error").length}
   Warnings: ${result.diagnostics.filter((d) => d.kind === "warning").length}
   Completed phase: ${completedPhase}`
      );
      for (const diagnostic of result.diagnostics) {
        this.log("errors", `${diagnostic.kind}: ${diagnostic.msg}`);
      }
      return result;
    } catch (error) {
      this.log("errors", `\u{1F4A5} Fatal analysis error: ${error}`);
      return this.createFatalErrorResult(error instanceof Error ? error.message : String(error));
    }
  }
  /**
   * Get debug log for troubleshooting
   */
  getDebugLog() {
    return [];
  }
  createServices(config) {
    var _a, _b;
    const debugManager = new DebugManager(void 0, (_a = config == null ? void 0 : config.debug) != null ? _a : "off");
    const contextTracker = new ContextTracker(debugManager);
    const diagnosticManager = new DiagnosticManager(contextTracker, (_b = config == null ? void 0 : config.strictMode) != null ? _b : false);
    const scopeManager = new ScopeManager(diagnosticManager, debugManager);
    return { debugManager, contextTracker, diagnosticManager, scopeManager };
  }
  createConfig(config) {
    var _a, _b, _c, _d, _e;
    return {
      debug: (_a = config.debug) != null ? _a : "off",
      stopAtPhase: (_b = config.stopAtPhase) != null ? _b : "SemanticValidation",
      strictMode: (_c = config.strictMode) != null ? _c : false,
      maxErrors: (_d = config.maxErrors) != null ? _d : 100,
      services: this.createServices(config),
      program: (_e = config.program) != null ? _e : null
    };
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌────────────────────────── PHASE EXECUTION ─────────────────────────┐
  executePhase1() {
    this.log("symbols", "\u{1F4C2} Phase 1: Symbol Collection");
    return this.symbolCollector.handle();
  }
  executePhase2() {
    this.log("symbols", "\u{1F517} Phase 2: Symbol Resolution");
    return this.symbolResolver.handle();
  }
  executePhase3() {
    this.log("symbols", "\u{1F50D} Phase 3: Type Validation");
    return this.typeValidator.handle();
  }
  executePhase4() {
    this.log("symbols", "\u2705 Phase 4: Semantic Validation");
    return this.semanticValidator.handle();
  }
  runPhase(phase, executor) {
    const startTime = Date.now();
    const errorsBefore = this.config.services.diagnosticManager.length();
    this.log("verbose", `\u{1F504} Starting phase: ${phase}`);
    this.config.services.debugManager.increaseIndent();
    try {
      const success = executor();
      const duration = Date.now() - startTime;
      const errorsAfter = this.config.services.diagnosticManager.length();
      const newErrors = Math.max(0, errorsAfter - errorsBefore);
      const newWarnings = this.config.services.diagnosticManager.getDiagnostics().slice(errorsBefore).filter((d) => d.kind === "warning").length;
      this.phaseTimings.set(phase, duration);
      const result = {
        success,
        phase,
        duration,
        errors: newErrors,
        warnings: newWarnings
      };
      this.log(
        "verbose",
        `\u2728 Phase ${phase} completed in ${duration}ms (${newErrors} errors, ${newWarnings} warnings)`
      );
      for (const diagnostic of this.config.services.diagnosticManager.getDiagnostics().slice(errorsBefore)) {
        this.log("errors", `${diagnostic.kind}: ${diagnostic.msg}`);
      }
      return result;
    } finally {
      this.config.services.debugManager.decreaseIndent();
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────── VALIDATION AND UTILITIES ───────────────────┐
  validateProgramStructure(program) {
    var _a;
    if (!program) {
      this.config.services.diagnosticManager.reportError(
        "INTERNAL_ERROR",
        "Program is null or undefined"
      );
      return false;
    }
    if (!program.modules || program.modules.size === 0) {
      this.config.services.diagnosticManager.reportError(
        "MODULE_NOT_FOUND",
        "Program contains no modules"
      );
      return false;
    }
    const entryModule = (_a = program.metadata) == null ? void 0 : _a.entryModule;
    if (entryModule && !program.modules.has(entryModule)) {
      this.config.services.diagnosticManager.reportError(
        "ENTRY_MODULE_NOT_FOUND",
        `Entry module '${entryModule}' not found`
      );
      return false;
    }
    return true;
  }
  shouldStopAtPhase(currentPhase, targetPhase) {
    const phaseOrder = [
      "Collection",
      "Resolution",
      "TypeValidation",
      "SemanticValidation"
      /* SemanticValidation */
    ];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const targetIndex = phaseOrder.indexOf(targetPhase);
    return currentIndex > targetIndex;
  }
  reset() {
    this.log("verbose", "\u{1F504} Resetting analyzer state...");
    this.phaseTimings.clear();
    this.config.services.contextTracker.reset();
    this.config.services.diagnosticManager.reset();
    this.config.services.debugManager.reset();
    this.config.services.scopeManager.reset();
    this.config.program = null;
    this.symbolCollector.reset();
    this.symbolResolver.reset();
    this.typeValidator.reset();
    this.semanticValidator.reset();
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌───────────────────────── RESULT GENERATION ────────────────────────┐
  createFinalResult(completedPhase, totalTime) {
    const diagnostics = this.config.services.diagnosticManager.getDiagnostics();
    const hasErrors = diagnostics.some(
      (d) => d.kind === "error"
      /* ERROR */
    );
    const result = {
      success: !hasErrors,
      diagnostics,
      completedPhase,
      debugInfo: {
        totalTime,
        phaseTimings: new Map(this.phaseTimings),
        memoryUsage: this.getMemoryUsage()
      }
    };
    return result;
  }
  createErrorResult(message, phase) {
    this.config.services.diagnosticManager.reportError("ANALYSIS_ERROR", message);
    return {
      success: false,
      diagnostics: this.config.services.diagnosticManager.getDiagnostics(),
      completedPhase: phase
    };
  }
  createFatalErrorResult(message) {
    return {
      success: false,
      diagnostics: [{
        code: "INTERNAL_ERROR",
        kind: "error",
        msg: `Fatal analysis error: ${message}`,
        targetSpan: { start: 0, end: 0 }
      }]
    };
  }
  getMemoryUsage() {
    try {
      if (typeof process !== "undefined" && process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      }
    } catch (e) {
    }
    return void 0;
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var __defProp3 = Object.defineProperty;
var __getOwnPropSymbols3 = Object.getOwnPropertySymbols;
var __hasOwnProp3 = Object.prototype.hasOwnProperty;
var __propIsEnum3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp3 = (obj, key, value) => key in obj ? __defProp3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues3 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp3.call(b, prop))
      __defNormalProp3(a, prop, b[prop]);
  if (__getOwnPropSymbols3)
    for (var prop of __getOwnPropSymbols3(b)) {
      if (__propIsEnum3.call(b, prop))
        __defNormalProp3(a, prop, b[prop]);
    }
  return a;
};
var Module = class _Module {
  // ┌──────────────────────────────── INIT ──────────────────────────────┐
  constructor(name, statements, exports, imports, metadata) {
    this.name = name;
    this.statements = statements;
    this.exports = exports;
    this.imports = imports;
    this.metadata = metadata;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(name, stmts, metadata) {
    return new _Module(name, stmts || [], [], [], metadata || {});
  }
  validate() {
    try {
      if (!this.name.trim()) {
        return false;
      }
      return this.statements.every((stmt) => stmt.validate());
    } catch (e) {
      return false;
    }
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── FIND ──────────────────────────────┐
  findStatements(predicate) {
    return this.statements.filter(predicate);
  }
  findStatement(predicate) {
    return this.statements.find(predicate);
  }
  findStatementsByKind(kind) {
    return this.statements.filter((stmt) => stmt.kind === kind);
  }
  findFunction(name) {
    for (const stmt of this.statements) {
      if (stmt.is("Func") && stmt.getFunc().ident.name === name) {
        return stmt.getFunc();
      }
    }
    return void 0;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── CTRL ──────────────────────────────┐
  removeStatement(index) {
    if (index < 0 || index >= this.statements.length) {
      throw new Error(`Statement index ${index} out of bounds (0-${this.statements.length - 1})`);
    }
    const newStatements = [...this.statements];
    newStatements.splice(index, 1);
    return new _Module(
      this.name,
      newStatements,
      [...this.exports],
      [...this.imports],
      __spreadValues3({}, this.metadata)
    );
  }
  insertStatement(index, statement) {
    if (index < 0 || index > this.statements.length) {
      throw new Error(`Statement index ${index} out of bounds (0-${this.statements.length})`);
    }
    const newStatements = [...this.statements];
    newStatements.splice(index, 0, statement);
    return new _Module(
      this.name,
      newStatements,
      [...this.exports],
      [...this.imports],
      __spreadValues3({}, this.metadata)
    );
  }
  replaceStatement(index, statement) {
    if (index < 0 || index >= this.statements.length) {
      throw new Error(`Statement index ${index} out of bounds (0-${this.statements.length - 1})`);
    }
    const newStatements = [...this.statements];
    newStatements[index] = statement;
    return new _Module(
      this.name,
      newStatements,
      [...this.exports],
      [...this.imports],
      __spreadValues3({}, this.metadata)
    );
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ──────────────────────────────┐
  isEmpty() {
    return this.statements.length === 0;
  }
  hasStatement(statement) {
    return this.statements.includes(statement);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ──────────────────────────────┐
  getStatementCount() {
    return this.statements.length;
  }
  getTotalNodes() {
    let count = 1;
    for (const statement of this.statements) {
      const countt = 0;
      statement.traverse(() => void count++);
      count += countt;
    }
    return count;
  }
  getStatementAt(index) {
    if (index < 0 || index >= this.statements.length) {
      return void 0;
    }
    return this.statements[index];
  }
  getStatementIndex(statement) {
    return this.statements.indexOf(statement);
  }
  getPublicStatements() {
    const arr = [];
    for (const stmt of this.statements) {
      if (stmt.is("Let") && stmt.getLet().field.visibility.kind !== "Private" || stmt.is("Def") && stmt.getDef().visibility.kind !== "Private" || stmt.is("Func") && stmt.getFunc().visibility.kind !== "Private") {
        arr.push(stmt);
      }
    }
    return arr;
  }
  getPath() {
    var _a;
    return ((_a = this.metadata) == null ? void 0 : _a.path) || "";
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var Program = class _Program {
  // ┌──────────────────────────────── INIT ──────────────────────────────┐
  constructor(modules, metadata) {
    this.modules = modules;
    this.metadata = metadata;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ──────────────────────────────┐
  static create(modules, metadata) {
    const modulesMap = /* @__PURE__ */ new Map();
    for (const module of modules || []) {
      modulesMap.set(module.name, module);
    }
    return new _Program(modulesMap, metadata);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── FIND ──────────────────────────────┐
  findModules(predicate) {
    const results = [];
    for (const [name, module] of this.modules) {
      if (predicate(module, name)) {
        results.push([name, module]);
      }
    }
    return results;
  }
  findModule(predicate) {
    for (const [name, module] of this.modules) {
      if (predicate(module, name)) {
        return [name, module];
      }
    }
    return void 0;
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── CTRL ──────────────────────────────┐
  removeModule(name) {
    if (!this.modules.has(name)) {
      return this;
    }
    const newModules = new Map(this.modules);
    newModules.delete(name);
    return new _Program(newModules, this.metadata);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ──────────────────────────────┐
  isEmpty() {
    return this.modules.size === 0 || Array.from(this.modules.values()).every((m) => m.statements.length === 0);
  }
  hasModule(name) {
    return this.modules.has(name);
  }
  // └────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ──────────────────────────────┐
  getModule(name) {
    return this.modules.get(name);
  }
  getModuleNames() {
    return Array.from(this.modules.keys());
  }
  getTotalModules() {
    return this.modules.size;
  }
  getTotalStatements() {
    return Array.from(this.modules.values()).reduce((total, module) => total + module.statements.length, 0);
  }
  getTotalNodes() {
    let count = this.modules.size;
    for (const module of this.modules.values()) {
      count += module.getTotalNodes();
    }
    return count;
  }
  // └────────────────────────────────────────────────────────────────────┘
};
var DEBUG_LEVEL = process.env.KEMET_DEBUG === "true" ? "verbose" : process.env.KEMET_DEBUG === "false" ? "off" : "verbose";
var DEBOUNCE_MS = parseInt(process.env.KEMET_DEBOUNCE_MS || "50");
var CACHE_MAX_SIZE = parseInt(process.env.KEMET_CACHE_SIZE || "100");
var CACHE_MAX_AGE_MS = parseInt(process.env.KEMET_CACHE_AGE_MS || "300000");
var MAX_FILE_SIZE_KB = parseInt(process.env.KEMET_MAX_FILE_SIZE_KB || "10240");
var FILE_SCAN_DEPTH_LIMIT = 50;
var debugMgr = new DebugManager(void 0, DEBUG_LEVEL);
var Project = class _Project extends EventEmitter.EventEmitter {
  constructor(rootPath, settings) {
    super();
    this.program = null;
    this.diagnosticCache = /* @__PURE__ */ new Map();
    this.pendingLintRequests = /* @__PURE__ */ new Map();
    this.lastLintResults = /* @__PURE__ */ new Map();
    this.metrics = this.createDefaultLintMetrics();
    this.fileWatcher = null;
    this.watcherDelay = null;
    this.watcherRestartAttempts = 0;
    this.MAX_WATCHER_RESTARTS = 3;
    this.cleanupInterval = null;
    this.isFirstLint = true;
    this.moduleParseErrors = /* @__PURE__ */ new Map();
    try {
      this.rootPath = rootPath;
      this.settings = settings;
      this.syntax = settings.syntax;
      if (!this.syntax) {
        throw new Error("Syntax is not available");
      }
      debugMgr.log("verbose", `[Project] Initialized project at ${rootPath}`);
      this.analyzer = Analyzer.create({
        debug: "off",
        stopAtPhase: AnalysisPhase.SemanticValidation,
        strictMode: false
      });
      if (!this.analyzer) {
        throw new Error("Failed to create Analyzer instance");
      }
      this.startPeriodicCleanup();
    } catch (e) {
      console.error(`[Project] Constructor error:`, e);
      throw e;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌─────────────────────────────── CREATE ───────────────────────────────┐
  static create(rootPath, settings) {
    try {
      return new _Project(rootPath, settings);
    } catch (e) {
      console.error(`[Project] Error creating project:`, e);
      throw e;
    }
  }
  static createAnonymous(syntax) {
    try {
      return new _Project("", {
        config: {},
        syntax,
        isAnonymous: true
      });
    } catch (e) {
      console.error(`[Project] Error creating anonymous project:`, e);
      throw e;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  lintAsync(sourceCode, modulePath) {
    return __async2(this, null, function* () {
      const key = modulePath || "anonymous";
      return new Promise((resolve2) => {
        const existingTimeout = this.pendingLintRequests.get(key);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
          this.pendingLintRequests.delete(key);
          const result = this.lintInternal(sourceCode, modulePath);
          this.lastLintResults.set(key, result);
          resolve2(result);
        }, DEBOUNCE_MS);
        this.pendingLintRequests.set(key, timeout);
      });
    });
  }
  lint(sourceCode, modulePath) {
    const key = modulePath || "anonymous";
    const cached = this.lastLintResults.get(key);
    if (cached) {
      return cached;
    }
    return this.lintInternal(sourceCode, modulePath);
  }
  lintInternal(sourceCode, modulePath) {
    const startTime = Date.now();
    const key = modulePath || "anonymous";
    debugMgr.log("verbose", `
${"=".repeat(80)}`);
    debugMgr.log("verbose", `[LINT] Starting lint operation for: ${key}`);
    const contextTracker = new ContextTracker();
    let result = {
      has_error: false,
      has_warning: false,
      diagnosticManager: new DiagnosticManager(contextTracker, true)
    };
    try {
      const hash = this.computeModuleHash(sourceCode);
      if (this.isFirstLint) {
        debugMgr.log("verbose", `[LINT] First lint - forcing full analysis`);
        this.isFirstLint = false;
      }
      debugMgr.log("verbose", `[LINT] Parsing source code...`);
      const parseResult = this.syntax.parse(sourceCode);
      if (parseResult.errors.length > 0) {
        debugMgr.log("verbose", `[LINT] Parse errors: ${parseResult.errors.length}`);
        result.has_error = true;
        for (const err of parseResult.errors) {
          const diagnostic = {
            code: DiagCode.SYNTAX_ERROR,
            kind: DiagKind.ERROR,
            contextSpan: err.span,
            targetSpan: err.span,
            // CRITICAL: Add targetSpan for proper positioning
            msg: err.msg
          };
          result.diagnosticManager.diagnostics.push(diagnostic);
        }
        if (modulePath) {
          this.moduleParseErrors.set(modulePath, parseResult.errors);
        }
        debugMgr.log("verbose", `[LINT] Added ${parseResult.errors.length} parse errors to diagnostics`);
        debugMgr.log("verbose", `[LINT] Total diagnostics now: ${result.diagnosticManager.diagnostics.length}`);
      } else {
        debugMgr.log("verbose", `[LINT] Parse successful`);
        if (modulePath) {
          this.moduleParseErrors.delete(modulePath);
        }
        const statements = parseResult.ast.length > 0 ? parseResult.ast[0].getCustomData() : [];
        const moduleName = modulePath ? Path.basename(modulePath, ".k") : "main";
        debugMgr.log("verbose", `[LINT] Creating module '${moduleName}' with ${statements.length} statements`);
        const freshModule = Module.create(moduleName, statements, { path: modulePath });
        if (!this.program) {
          const existingModules = this.loadExistingModules();
          this.program = Program.create(existingModules, { path: this.rootPath });
        }
        this.program.modules.set(moduleName, freshModule);
        if (modulePath && !this.settings.isAnonymous) {
          const sourceDir = this.getSourceDirectory();
          const allKemetFiles = this.scanKemetFiles(sourceDir);
          for (const filePath of allKemetFiles) {
            const otherModuleName = Path.basename(filePath, ".k");
            if (otherModuleName === moduleName) continue;
            if (!this.program.modules.has(otherModuleName)) {
              const module = this.parseModuleFromFile(filePath);
              if (module) {
                this.program.modules.set(otherModuleName, module);
                debugMgr.log("verbose", `[LINT] Loaded dependency module '${otherModuleName}'`);
                const depParseErrors = this.moduleParseErrors.get(filePath);
                if (depParseErrors && depParseErrors.length > 0) {
                  debugMgr.log("verbose", `[LINT] Found ${depParseErrors.length} cached parse errors for '${otherModuleName}'`);
                  for (const err of depParseErrors) {
                    result.diagnosticManager.diagnostics.push({
                      code: DiagCode.SYNTAX_ERROR,
                      kind: DiagKind.ERROR,
                      contextSpan: err.span,
                      targetSpan: err.span,
                      msg: err.msg,
                      sourceModuleName: otherModuleName,
                      sourceModulePath: filePath
                    });
                  }
                  result.has_error = true;
                }
              }
            }
          }
        }
        debugMgr.log("verbose", `[LINT] Analyzing program...`);
        this.analyzer.reset();
        const analyzerResult = this.analyzer.analyze(this.program);
        const allDiagnostics = analyzerResult.diagnostics;
        const filteredDiagnostics = modulePath ? allDiagnostics.filter((diag) => {
          if (diag.sourceModuleName) {
            return diag.sourceModuleName === moduleName;
          }
          if (diag.sourceModulePath) {
            return diag.sourceModulePath === modulePath || diag.sourceModulePath === `./${moduleName}`;
          }
          return true;
        }) : allDiagnostics;
        debugMgr.log("verbose", `[LINT] Filtered ${allDiagnostics.length} -> ${filteredDiagnostics.length} diagnostics`);
        result.diagnosticManager.diagnostics = filteredDiagnostics;
        for (const diag of filteredDiagnostics) {
          if (diag.kind === DiagKind.ERROR) {
            result.has_error = true;
          } else if (diag.kind === DiagKind.WARNING) {
            result.has_warning = true;
          }
        }
      }
      this.diagnosticCache.set(key, {
        hash,
        result,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error(`[LINT] Exception during lint:`, e);
      if (e instanceof Error) {
        console.error(`[LINT] Stack:`, e.stack);
      }
      result.has_error = true;
      result.diagnosticManager.getAllErrors().push({
        code: DiagCode.INTERNAL_ERROR,
        kind: DiagKind.ERROR,
        msg: `Internal linting error: ${e instanceof Error ? e.message : "Unknown error"}`
      });
    } finally {
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, false);
      debugMgr.log("verbose", `[LINT] Complete in ${duration}ms`);
      debugMgr.log("verbose", `${"=".repeat(80)}
`);
    }
    return result;
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  scanKemetFiles(directory) {
    const files = [];
    const scan = (dir, depth = 0) => {
      try {
        if (depth > FILE_SCAN_DEPTH_LIMIT) {
          console.warn(`[Project] Directory scanning depth exceeded at: ${dir}`);
          return;
        }
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          try {
            const fullPath = Path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!["node_modules", ".git", "dist", "out", "build"].includes(entry.name)) {
                scan(fullPath, depth + 1);
              }
            } else if (entry.isFile() && entry.name.endsWith(".k")) {
              const stats = fs.statSync(fullPath);
              const sizeKB = stats.size / 1024;
              if (sizeKB > MAX_FILE_SIZE_KB) {
                console.warn(`[Project] Skipping large file (${sizeKB.toFixed(0)}KB): ${fullPath}`);
                continue;
              }
              files.push(fullPath);
            }
          } catch (entryError) {
            console.warn(`[Project] Error processing entry: ${entryError}`);
            continue;
          }
        }
      } catch (e) {
        console.error(`[Project] Failed to scan directory ${dir}:`, e);
      }
    };
    try {
      scan(directory);
    } catch (e) {
      console.error(`[Project] Critical error during file scan:`, e);
    }
    return files;
  }
  parseModuleFromFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_FILE_SIZE_KB * 1024) {
        console.warn(`[Project] File too large to parse: ${filePath}`);
        return null;
      }
      const content = fs.readFileSync(filePath, { encoding: "utf-8" });
      const parseResult = this.syntax.parse(content);
      const moduleName = Path.basename(filePath, ".k");
      if (parseResult.errors.length > 0) {
        console.warn(`[Project] Parse errors in ${filePath}: (${parseResult.errors.length})`, parseResult.errors);
        this.moduleParseErrors.set(filePath, parseResult.errors);
        const module2 = Module.create(moduleName, []);
        module2.metadata.path = filePath;
        module2.metadata.hasParseErrors = true;
        return module2;
      }
      this.moduleParseErrors.delete(filePath);
      const statements = parseResult.ast.length > 0 ? parseResult.ast[0].getCustomData() : [];
      const module = Module.create(moduleName, statements);
      module.metadata.path = filePath;
      return module;
    } catch (e) {
      console.error(`[Project] Failed to parse file ${filePath}:`, e);
      return null;
    }
  }
  computeModuleHash(content) {
    try {
      return crypto.createHash("sha256").update(content).digest("hex");
    } catch (e) {
      console.error(`[Project] Error computing hash:`, e);
      return content.split("").reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0).toString();
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  getMetrics() {
    return __spreadValues({}, this.metrics);
  }
  updateMetrics(duration, cacheHit) {
    this.metrics.totalLints++;
    this.metrics.totalTime += duration;
    if (cacheHit) this.metrics.cacheHits++;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalLints;
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      this.metrics.peakMemory = Math.max(this.metrics.peakMemory, memUsage);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  startPeriodicCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
      this.cleanupOldResults();
    }, 6e4);
  }
  cleanupCache() {
    try {
      const now = Date.now();
      let deleted = 0;
      for (const [key, cached] of this.diagnosticCache.entries()) {
        if (now - cached.timestamp > CACHE_MAX_AGE_MS) {
          this.diagnosticCache.delete(key);
          deleted++;
        }
      }
      if (this.diagnosticCache.size > CACHE_MAX_SIZE) {
        const entries = Array.from(this.diagnosticCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(0, entries.length - CACHE_MAX_SIZE);
        toDelete.forEach(([key]) => {
          this.diagnosticCache.delete(key);
          deleted++;
        });
      }
      if (deleted > 0) {
        debugMgr.log("verbose", `[Project] Cleaned up ${deleted} cache entries`);
      }
    } catch (e) {
      console.error("[Project] Error during cache cleanup:", e);
    }
  }
  cleanupOldResults() {
    try {
      if (this.lastLintResults.size > CACHE_MAX_SIZE) {
        const keys = Array.from(this.lastLintResults.keys());
        const toDelete = keys.slice(0, keys.length - CACHE_MAX_SIZE);
        toDelete.forEach((k) => this.lastLintResults.delete(k));
        debugMgr.log("verbose", `[Project] Cleaned up ${toDelete.length} old results`);
      }
    } catch (e) {
      console.error("[Project] Error cleaning old results:", e);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ────────────────────────────────┐
  createDefaultLintMetrics() {
    return {
      totalLints: 0,
      totalTime: 0,
      cacheHits: 0,
      averageTime: 0,
      peakMemory: 0
    };
  }
  initializeProgram() {
    try {
      const modules = this.loadExistingModules();
      this.program = Program.create(modules, { path: this.rootPath });
      debugMgr.log("verbose", `[Project] Initialized program with ${modules.length} module(s)`);
      debugMgr.log("verbose", `[Project] Program modules map has: [${Array.from(this.program.modules.keys()).join(", ")}]`);
      if (this.program.modules.size > 0) {
        debugMgr.log("verbose", `[Project] Running initial analysis to populate module metadata...`);
        try {
          this.analyzer.reset();
          const initialAnalysis = this.analyzer.analyze(this.program);
          debugMgr.log("verbose", `[Project] Initial analysis complete: ${initialAnalysis.success ? "success" : "with errors"}`);
          debugMgr.log("verbose", `[Project] Found ${initialAnalysis.diagnostics.length} diagnostics`);
        } catch (e) {
          console.error(`[Project] Error during initial analysis:`, e);
        }
      }
      if (!this.settings.isAnonymous && this.rootPath) {
        this.startFileWatcher();
      }
    } catch (e) {
      console.error(`[Project] Error initializing program:`, e);
      this.program = Program.create([], { path: this.rootPath });
    }
  }
  loadExistingModules() {
    try {
      if (this.settings.isAnonymous || !this.rootPath) {
        return [];
      }
      const sourceDir = this.getSourceDirectory();
      if (!fs.existsSync(sourceDir)) {
        console.warn(`[Project] Source directory does not exist: ${sourceDir}`);
        return [];
      }
      const kemetFiles = this.scanKemetFiles(sourceDir);
      const modules = [];
      debugMgr.log("verbose", `[Project] Found ${kemetFiles.length} Kemet files to load`);
      for (const filePath of kemetFiles) {
        try {
          const module = this.parseModuleFromFile(filePath);
          if (module) {
            modules.push(module);
            debugMgr.log("verbose", `[Project] Loaded module '${module.name}' from ${filePath}`);
          }
        } catch (e) {
          console.error(`[Project] Error loading module from ${filePath}:`, e);
          continue;
        }
      }
      return modules;
    } catch (e) {
      console.error(`[Project] Error loading existing modules:`, e);
      return [];
    }
  }
  getSourceDirectory() {
    try {
      if (!this.settings.config.main) {
        return this.rootPath;
      }
      const mainPath = Path.join(this.rootPath, this.settings.config.main);
      if (!fs.existsSync(mainPath)) {
        console.warn(`[Project] Main path does not exist: ${mainPath}`);
        return this.rootPath;
      }
      const stats = fs.statSync(mainPath);
      return stats.isDirectory() ? mainPath : Path.dirname(mainPath);
    } catch (e) {
      console.error(`[Project] Error getting source directory:`, e);
      return this.rootPath;
    }
  }
  static loadConfigFromPath(rootPath) {
    try {
      const configPath = Path.join(rootPath, "config.json");
      if (!fs.existsSync(configPath)) {
        debugMgr.log("verbose", `[Project] No config.json at ${rootPath}`);
        return {};
      }
      const configContent = fs.readFileSync(configPath, { encoding: "utf-8" });
      const config = JSON.parse(configContent);
      debugMgr.log("verbose", `[Project] Loaded config: ${JSON.stringify(config, null, 2)}`);
      return config;
    } catch (e) {
      console.error(`[Project] Error loading config from ${rootPath}:`, e);
      return {};
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  startFileWatcher() {
    try {
      const sourceDir = this.getSourceDirectory();
      if (!fs.existsSync(sourceDir)) {
        console.warn(`[Project] Cannot watch non-existent directory: ${sourceDir}`);
        return;
      }
      this.fileWatcher = fs.watch(sourceDir, { recursive: true }, (eventType, filename) => {
        try {
          if (!filename || !filename.endsWith(".k")) {
            return;
          }
          const filePath = Path.join(sourceDir, filename);
          if (this.watcherDelay) {
            clearTimeout(this.watcherDelay);
          }
          this.watcherDelay = setTimeout(() => {
            try {
              this.handleFileSystemChange(eventType, filePath);
            } catch (e) {
              console.error(`[Project] Error handling file change:`, e);
            }
          }, 100);
        } catch (e) {
          console.error(`[Project] Error in file watcher callback:`, e);
        }
      });
      this.fileWatcher.on("error", (error) => {
        console.error("[Project] File watcher error:", error);
        this.handleWatcherError();
      });
      this.watcherRestartAttempts = 0;
      debugMgr.log("verbose", `[Project] File watcher started for ${sourceDir}`);
    } catch (e) {
      console.error(`[Project] Failed to start file watcher:`, e);
    }
  }
  handleWatcherError() {
    if (this.watcherRestartAttempts >= this.MAX_WATCHER_RESTARTS) {
      console.error("[Project] Max watcher restart attempts reached, giving up");
      return;
    }
    this.watcherRestartAttempts++;
    console.log(`[Project] Attempting to restart file watcher (attempt ${this.watcherRestartAttempts})`);
    setTimeout(() => {
      try {
        if (this.fileWatcher) {
          this.fileWatcher.close();
          this.fileWatcher = null;
        }
        this.startFileWatcher();
      } catch (e) {
        console.error("[Project] Failed to restart file watcher:", e);
      }
    }, 1e3 * this.watcherRestartAttempts);
  }
  handleFileSystemChange(eventType, filePath) {
    try {
      const moduleName = Path.basename(filePath, ".k");
      this.diagnosticCache.delete(filePath);
      this.lastLintResults.delete(filePath);
      this.moduleParseErrors.delete(filePath);
      if (eventType === "change") {
        console.log(`[Project] File modified: ${filePath}`);
        this.emit("moduleUpdated", moduleName);
      } else if (eventType === "rename" || !fs.existsSync(filePath)) {
        console.log(`[Project] File deleted/removed: ${filePath}`);
        this.emit("moduleRemoved", moduleName);
      } else {
        console.log(`[Project] File added: ${filePath}`);
        this.emit("moduleAdded", moduleName);
      }
    } catch (e) {
      console.error(`[Project] Error handling file system change:`, e);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  destroy() {
    try {
      console.log("[Project] Destroying project resources");
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      for (const timeout of this.pendingLintRequests.values()) {
        clearTimeout(timeout);
      }
      this.pendingLintRequests.clear();
      this.lastLintResults.clear();
      this.diagnosticCache.clear();
      this.moduleParseErrors.clear();
      if (this.fileWatcher) {
        this.fileWatcher.close();
        this.fileWatcher = null;
      }
      if (this.watcherDelay) {
        clearTimeout(this.watcherDelay);
        this.watcherDelay = null;
      }
      this.removeAllListeners();
      console.log("[Project] Final metrics:", this.getMetrics());
      console.log("[Project] Project destroyed successfully");
    } catch (e) {
      console.error("[Project] Error during destruction:", e);
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
};

// lib/utils/diagnostics.ts
import {
  DiagnosticSeverity,
  DocumentDiagnosticReportKind
} from "vscode-languageserver";
import { fileURLToPath } from "url";
import * as Path2 from "path";
var DiagnosticsHandler = class {
  constructor(connection, documents, projects, settingsManager, serverMetrics) {
    this.inFlightValidations = /* @__PURE__ */ new Map();
    this.connection = connection;
    this.documents = documents;
    this.projects = projects;
    this.settingsManager = settingsManager;
    this.serverMetrics = serverMetrics;
    this.setupHandlers();
  }
  setupHandlers() {
    this.connection.languages.diagnostics.on((params) => __async(this, null, function* () {
      return this.handleDiagnostics(params);
    }));
  }
  handleDiagnostics(params) {
    return __async(this, null, function* () {
      try {
        const document = this.documents.get(params.textDocument.uri);
        if (!document) {
          return {
            kind: DocumentDiagnosticReportKind.Full,
            items: []
          };
        }
        let validationPromise = this.inFlightValidations.get(document.uri);
        if (!validationPromise) {
          validationPromise = this.validateDocument(document);
          this.inFlightValidations.set(document.uri, validationPromise);
          validationPromise.finally(() => {
            this.inFlightValidations.delete(document.uri);
          });
        }
        const diagnostics = yield validationPromise;
        console.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics for ${document.uri}`);
        return {
          kind: DocumentDiagnosticReportKind.Full,
          items: diagnostics
        };
      } catch (e) {
        console.error("[DIAGNOSTICS] Error:", e);
        return {
          kind: DocumentDiagnosticReportKind.Full,
          items: [{
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 }
            },
            message: `LSP internal error: ${e instanceof Error ? e.message : "Unknown error"}`,
            source: "kemet-lsp"
          }]
        };
      }
    });
  }
  validateDocument(document) {
    return __async(this, null, function* () {
      const startTime = Date.now();
      try {
        const diagnostics = [];
        const text = document.getText();
        const uri = document.uri;
        console.log(`[DIAGNOSTICS] Starting validation for: ${uri}`);
        const settings = yield this.settingsManager.getDocumentSettings(uri);
        const { project, modulePath } = this.determineProject(uri);
        const result = yield project.lintAsync(text, modulePath);
        console.log(`[DIAGNOSTICS] Lint result: has_error=${result.has_error}, has_warning=${result.has_warning}`);
        const allErrors = result.diagnosticManager.getAllErrors();
        const allWarnings = result.diagnosticManager.getAllWarnings();
        const allInfos = result.diagnosticManager.getAllInfos();
        console.log(`[DIAGNOSTICS] DiagnosticManager stats:`);
        console.log(`  - Errors: ${allErrors.length}`);
        console.log(`  - Warnings: ${allWarnings.length}`);
        console.log(`  - Infos: ${allInfos.length}`);
        const allKemetDiags = [...allErrors, ...allWarnings, ...allInfos];
        for (const kemetDiag of allKemetDiags) {
          const diagnostic = this.convertKemetDiagnostic(kemetDiag, document, settings);
          if (diagnostic) {
            diagnostics.push(diagnostic);
          }
        }
        const maxDiagnostics = settings.maxDiagnostics || 100;
        if (diagnostics.length > maxDiagnostics) {
          const truncated = diagnostics.slice(0, maxDiagnostics);
          truncated.push({
            severity: DiagnosticSeverity.Warning,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 }
            },
            message: `Too many diagnostics. Showing first ${maxDiagnostics} of ${diagnostics.length}.`,
            source: "kemet-lsp"
          });
          this.updateMetrics(startTime, allErrors.length);
          return truncated;
        }
        this.updateMetrics(startTime, allErrors.length);
        const duration = Date.now() - startTime;
        console.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics in ${duration}ms`);
        return diagnostics;
      } catch (e) {
        console.error("[DIAGNOSTICS] Unexpected error:", e);
        if (e instanceof Error) {
          console.error("[DIAGNOSTICS] Stack:", e.stack);
        }
        this.serverMetrics.totalValidations++;
        return [{
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
          },
          message: `LSP internal error: ${e instanceof Error ? e.message : "Unknown error"}. Please check the output console.`,
          source: "kemet-lsp"
        }];
      }
    });
  }
  determineProject(uri) {
    if (uri.startsWith("file://")) {
      try {
        const filePath = fileURLToPath(uri);
        const relative5 = Path2.relative(this.projects.main.rootPath, filePath);
        const isInProject = !relative5.startsWith("..") && !Path2.isAbsolute(relative5);
        if (isInProject && filePath.endsWith(".k")) {
          console.log(`[DIAGNOSTICS] Using main project for: ${filePath}`);
          return { project: this.projects.main, modulePath: filePath };
        }
      } catch (e) {
        console.warn("[DIAGNOSTICS] Error determining project:", e);
      }
    }
    console.log("[DIAGNOSTICS] Using anonymous project");
    return { project: this.projects.anonymous };
  }
  convertKemetDiagnostic(kemetDiag, document, settings) {
    var _a, _b;
    try {
      const span = (_b = (_a = kemetDiag.targetSpan) != null ? _a : kemetDiag.contextSpan) != null ? _b : { start: 0, end: 0 };
      let severity;
      if (kemetDiag.kind === "error") {
        severity = DiagnosticSeverity.Error;
      } else if (kemetDiag.kind === "warning") {
        if (settings.showWarnings === false) return null;
        severity = DiagnosticSeverity.Warning;
      } else {
        if (settings.showInfos === false) return null;
        severity = DiagnosticSeverity.Information;
      }
      return {
        severity,
        range: {
          start: document.positionAt(span.start),
          end: document.positionAt(span.end)
        },
        message: kemetDiag.msg,
        source: "kemet-lsp",
        code: kemetDiag.code
      };
    } catch (e) {
      console.warn("[DIAGNOSTICS] Error converting diagnostic:", e);
      return null;
    }
  }
  updateMetrics(startTime, errorCount) {
    this.serverMetrics.totalValidations++;
    this.serverMetrics.totalErrors += errorCount;
    const duration = Date.now() - startTime;
    this.serverMetrics.averageValidationTime = (this.serverMetrics.averageValidationTime * (this.serverMetrics.totalValidations - 1) + duration) / this.serverMetrics.totalValidations;
  }
  clearInflightValidation(uri) {
    this.inFlightValidations.delete(uri);
  }
};

// lib/utils/completion.ts
import {
  CompletionItemKind
} from "vscode-languageserver";
import { fileURLToPath as fileURLToPath2 } from "url";
import * as Path3 from "path";
var KEYWORDS = {
  declarations: ["let", "fn", "def", "use", "pub", "test"],
  types: [
    "i8",
    "i16",
    "i32",
    "i64",
    "isize",
    "u8",
    "u16",
    "u32",
    "u64",
    "usize",
    "f16",
    "f32",
    "f64",
    "bool",
    "str",
    "char",
    "void",
    "any",
    "type",
    "struct",
    "enum",
    "errset",
    "null_t",
    "und_t"
  ],
  controlFlow: [
    "if",
    "else",
    "switch",
    "case",
    "default",
    "for",
    "while",
    "break",
    "continue",
    "return",
    "defer",
    "throw"
  ],
  modifiers: ["mut", "pub", "static", "inline", "comptime"],
  operators: ["as", "typeof", "sizeof", "try", "catch", "orelse"],
  literals: ["true", "false", "null", "und"],
  builtins: ["@print", "@i", "self"]
};
var KEYWORD_DOCS = {
  "fn": { detail: "fn", documentation: "Declare a function\nExample: fn name(param: type) -> type { }" },
  "let": { detail: "let", documentation: "Declare a variable\nExample: let name: type = value;" },
  "pub": { detail: "pub", documentation: "Make item public (exported from module)" },
  "use": { detail: "use", documentation: 'Import from another module\nExample: use symbol from "path"' },
  "def": { detail: "def", documentation: "Define a type alias\nExample: def MyType = i32" },
  "struct": { detail: "struct", documentation: "Declare a structure\nExample: struct { field: type }" },
  "enum": { detail: "enum", documentation: "Declare an enumeration\nExample: enum { Variant }" },
  "if": { detail: "if", documentation: "Conditional statement\nExample: if condition { }" },
  "else": { detail: "else", documentation: "Alternative branch for if" },
  "while": { detail: "while", documentation: "Loop statement\nExample: while condition { }" },
  "for": { detail: "for", documentation: "For-range loop\nExample: for 0..10 { }" },
  "return": { detail: "return", documentation: "Return from function\nExample: return value;" },
  "mut": { detail: "mut", documentation: "Mutable modifier for variables" },
  "try": { detail: "try", documentation: "Try an expression that may error" },
  "catch": { detail: "catch", documentation: "Catch errors from try expression" }
};
var CompletionHandler = class {
  constructor(connection, documents, projects) {
    this.connection = connection;
    this.documents = documents;
    this.projects = projects;
    this.setupHandlers();
  }
  setupHandlers() {
    this.connection.onCompletion((params) => {
      return this.handleCompletion(params);
    });
    this.connection.onCompletionResolve((item) => {
      return this.handleCompletionResolve(item);
    });
  }
  handleCompletion(params) {
    try {
      console.log("[COMPLETION] Request received at position:", params.position);
      const document = this.documents.get(params.textDocument.uri);
      if (!document) {
        console.warn("[COMPLETION] Document not found");
        return [];
      }
      const context = this.analyzeCompletionContext(document, params);
      console.log("[COMPLETION] Context:", JSON.stringify(context, null, 2));
      const items = [];
      if (!context.isAfterDot) {
        items.push(...this.getKeywordCompletions(context));
        items.push(...this.getBuiltinCompletions());
        items.push(...this.getScopeSymbolCompletions(document, params));
      }
      console.log(`[COMPLETION] Returning ${items.length} total items`);
      return items;
    } catch (e) {
      console.error("[COMPLETION] Error:", e);
      if (e instanceof Error) {
        console.error("[COMPLETION] Stack:", e.stack);
      }
      return [];
    }
  }
  handleCompletionResolve(item) {
    try {
      if (item.data && typeof item.data === "string" && item.data.startsWith("keyword_")) {
        const keyword = item.label;
        const doc = KEYWORD_DOCS[keyword];
        if (doc) {
          item.detail = doc.detail;
          item.documentation = doc.documentation;
        }
      }
      return item;
    } catch (e) {
      console.error("[COMPLETION] CompletionResolve error:", e);
      return item;
    }
  }
  analyzeCompletionContext(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position.position);
    const lineText = text.substring(
      document.offsetAt({ line: position.position.line, character: 0 }),
      offset
    );
    const tokens = lineText.trim().split(/\s+/);
    const previousToken = tokens.length > 1 ? tokens[tokens.length - 2] : "";
    const currentToken = tokens[tokens.length - 1] || "";
    return {
      isInFunction: /\bfn\b/.test(text.substring(0, offset)),
      isInStruct: /\bstruct\s*\{/.test(text.substring(0, offset)),
      isInEnum: /\benum\s*\{/.test(text.substring(0, offset)),
      isAfterDot: currentToken.endsWith(".") || previousToken === ".",
      isAfterUse: previousToken === "use",
      isAfterLet: previousToken === "let",
      isAfterFn: previousToken === "fn",
      isAfterDef: previousToken === "def",
      previousToken,
      currentScope: "global"
    };
  }
  getKeywordCompletions(context) {
    const items = [];
    let keywords = [];
    if (context.isAfterLet) {
      keywords = ["mut", ...KEYWORDS.types];
    } else if (context.isAfterFn || context.isAfterDef) {
      return [];
    } else if (context.isAfterUse) {
      return [];
    } else if (context.isInFunction) {
      keywords = [
        ...KEYWORDS.controlFlow,
        ...KEYWORDS.declarations.filter((k) => k !== "pub"),
        ...KEYWORDS.operators,
        ...KEYWORDS.literals
      ];
    } else {
      keywords = [
        ...KEYWORDS.declarations,
        ...KEYWORDS.types,
        ...KEYWORDS.controlFlow,
        ...KEYWORDS.modifiers,
        ...KEYWORDS.operators,
        ...KEYWORDS.literals
      ];
    }
    keywords.forEach((keyword, index) => {
      const item = {
        label: keyword,
        kind: KEYWORDS.types.includes(keyword) ? CompletionItemKind.TypeParameter : KEYWORDS.controlFlow.includes(keyword) ? CompletionItemKind.Keyword : CompletionItemKind.Keyword,
        data: `keyword_${index}`,
        sortText: `0_${keyword}`
      };
      items.push(item);
    });
    return items;
  }
  getBuiltinCompletions() {
    return KEYWORDS.builtins.map((builtin, index) => ({
      label: builtin,
      kind: builtin === "self" ? CompletionItemKind.Variable : CompletionItemKind.Function,
      data: `builtin_${index}`,
      detail: builtin === "@print" ? "fn(str) -> void" : void 0,
      sortText: `1_${builtin}`
    }));
  }
  getScopeSymbolCompletions(document, position) {
    var _a, _b;
    try {
      const uri = position.textDocument.uri;
      const text = document.getText();
      const { project, modulePath, currentModuleName } = this.determineProject(uri);
      console.log("[COMPLETION] Running lint for autocomplete...");
      const startLint = Date.now();
      const result = project.lint(text, modulePath);
      console.log(`[COMPLETION] Lint completed in ${Date.now() - startLint}ms`);
      const scopeManager = this.getScopeManager(project);
      if (!scopeManager) {
        console.error("[COMPLETION] Could not access scope manager");
        return [];
      }
      const allSymbols = scopeManager.getAllSymbols();
      console.log(`[COMPLETION] Found ${allSymbols.length} total symbols`);
      const items = [];
      const seenSymbols = /* @__PURE__ */ new Set();
      for (const symbol of allSymbols) {
        if (seenSymbols.has(symbol.name) || ((_a = symbol.metadata) == null ? void 0 : _a.isSynthetic)) {
          continue;
        }
        const symbolModule = symbol.module || "";
        const isFromCurrentModule = symbolModule === modulePath || symbolModule === currentModuleName || symbolModule === "";
        const isImport = symbol.kind === "Use";
        const isBuiltin = ((_b = symbol.metadata) == null ? void 0 : _b.isBuiltin) === true;
        const isPublicExported = symbol.isExported && symbol.visibility.kind === "Public";
        if (!isFromCurrentModule && !isImport && !isBuiltin && !isPublicExported) {
          continue;
        }
        seenSymbols.add(symbol.name);
        const item = {
          label: symbol.name,
          kind: this.getCompletionItemKind(symbol.kind),
          data: `symbol_${symbol.id}`,
          detail: this.getSymbolDetail(symbol),
          documentation: this.getSymbolDocumentation(symbol),
          sortText: `2_${symbol.name}`
        };
        items.push(item);
      }
      console.log(`[COMPLETION] Returning ${items.length} symbols`);
      return items;
    } catch (error) {
      console.error("[COMPLETION] Error getting scope symbols:", error);
      return [];
    }
  }
  determineProject(uri) {
    if (uri.startsWith("file://")) {
      try {
        const filePath = fileURLToPath2(uri);
        const relative5 = Path3.relative(this.projects.main.rootPath, filePath);
        const isInProject = !relative5.startsWith("..") && !Path3.isAbsolute(relative5);
        if (isInProject && filePath.endsWith(".k")) {
          const moduleName = Path3.basename(filePath, ".k");
          console.log(`[COMPLETION] Using main project, module: ${moduleName}`);
          return {
            project: this.projects.main,
            modulePath: filePath,
            currentModuleName: moduleName
          };
        }
      } catch (e) {
        console.warn("[COMPLETION] Error determining project:", e);
      }
    }
    console.log("[COMPLETION] Using anonymous project");
    return {
      project: this.projects.anonymous,
      currentModuleName: "main"
    };
  }
  getScopeManager(project) {
    var _a, _b, _c, _d;
    if (project.analyzer) {
      return (_b = (_a = project.analyzer.config) == null ? void 0 : _a.services) == null ? void 0 : _b.scopeManager;
    }
    const analyzer = project._analyzer || project.analyzer;
    if (analyzer) {
      return (_d = (_c = analyzer.config) == null ? void 0 : _c.services) == null ? void 0 : _d.scopeManager;
    }
    if (typeof project.getScopeManager === "function") {
      return project.getScopeManager();
    }
    return null;
  }
  getCompletionItemKind(symbolKind) {
    switch (symbolKind) {
      case "Function":
        return CompletionItemKind.Function;
      case "Variable":
        return CompletionItemKind.Variable;
      case "Parameter":
        return CompletionItemKind.Variable;
      case "Definition":
        return CompletionItemKind.Class;
      case "StructField":
        return CompletionItemKind.Field;
      case "EnumVariant":
        return CompletionItemKind.EnumMember;
      case "Use":
        return CompletionItemKind.Module;
      default:
        return CompletionItemKind.Text;
    }
  }
  getSymbolDetail(symbol) {
    if (symbol.type) {
      return `${symbol.kind}: ${this.formatType(symbol.type)}`;
    }
    return symbol.kind;
  }
  getSymbolDocumentation(symbol) {
    var _a;
    const parts = [];
    if (symbol.visibility.kind === "Public") parts.push("public");
    if (symbol.mutability.kind === "Mutable") parts.push("mut");
    if ((_a = symbol.metadata) == null ? void 0 : _a.callable) parts.push("callable");
    if (symbol.isExported) parts.push("exported");
    return parts.join(", ");
  }
  formatType(type) {
    var _a, _b, _c;
    if (!type || !type.kind) return "unknown";
    switch (type.kind) {
      case "i8":
      case "i16":
      case "i32":
      case "i64":
      case "u8":
      case "u16":
      case "u32":
      case "u64":
      case "f32":
      case "f64":
      case "bool":
      case "void":
      case "str":
        return type.kind;
      case "pointer":
        return `*${this.formatType((_a = type.getPointer()) == null ? void 0 : _a.target)}`;
      case "array":
        return `[]${this.formatType((_b = type.getArray()) == null ? void 0 : _b.target)}`;
      case "optional":
        return `?${this.formatType((_c = type.getOptional()) == null ? void 0 : _c.target)}`;
      case "function":
        return "fn";
      case "struct":
        return "struct";
      case "enum":
        return "enum";
      default:
        return type.kind;
    }
  }
};

// lib/utils/hover.ts
import {
  MarkupKind
} from "vscode-languageserver";
import { fileURLToPath as fileURLToPath3 } from "url";
import * as Path4 from "path";
var KEYWORDS2 = {
  declarations: ["let", "fn", "def", "use", "pub", "test"],
  types: [
    "i8",
    "i16",
    "i32",
    "i64",
    "isize",
    "u8",
    "u16",
    "u32",
    "u64",
    "usize",
    "f16",
    "f32",
    "f64",
    "f80",
    "f128",
    "bool",
    "str",
    "char",
    "void",
    "any",
    "type",
    "struct",
    "enum",
    "errset",
    "null_t",
    "und_t",
    "err",
    "cint",
    "cflt"
  ],
  controlFlow: [
    "if",
    "else",
    "switch",
    "case",
    "default",
    "for",
    "while",
    "break",
    "continue",
    "return",
    "defer",
    "throw"
  ],
  modifiers: ["mut", "pub", "static", "inline", "comptime"],
  operators: ["as", "typeof", "sizeof", "try", "catch", "orelse"],
  literals: ["true", "false", "null", "und"]
};
var KEYWORD_DOCS2 = {
  // Declarations
  "let": { signature: "let [pub] [mut] name: type = value", description: "Declare a variable", example: "let mut counter: i32 = 0;" },
  "fn": { signature: "fn [pub] name(params) -> type { }", description: "Declare a function", example: "pub fn add(a: i32, b: i32) -> i32 { return a + b; }" },
  "def": { signature: "def [pub] Name = type", description: "Define a type alias", example: "def MyInt = i32;" },
  "use": { signature: 'use symbol [as alias] from "path"', description: "Import a symbol from another module", example: 'use MyType as T from "./types.k";' },
  // Type keywords
  "struct": { signature: "struct { fields... }", description: "Define a structure type", example: "struct { x: i32, y: i32 }" },
  "enum": { signature: "enum { Variant1, Variant2, ... }", description: "Define an enumeration type", example: "enum { Some: i32, None }" },
  "errset": { signature: "errset { Error1, Error2, ... }", description: "Define an error set type", example: "errset { FileNotFound, AccessDenied }" },
  // Primitive types
  "i8": { signature: "i8", description: "Signed 8-bit integer (-128 to 127)" },
  "i16": { signature: "i16", description: "Signed 16-bit integer (-32,768 to 32,767)" },
  "i32": { signature: "i32", description: "Signed 32-bit integer (-2,147,483,648 to 2,147,483,647)" },
  "i64": { signature: "i64", description: "Signed 64-bit integer" },
  "u8": { signature: "u8", description: "Unsigned 8-bit integer (0 to 255)" },
  "u16": { signature: "u16", description: "Unsigned 16-bit integer (0 to 65,535)" },
  "u32": { signature: "u32", description: "Unsigned 32-bit integer (0 to 4,294,967,295)" },
  "u64": { signature: "u64", description: "Unsigned 64-bit integer" },
  "f32": { signature: "f32", description: "Single-precision 32-bit floating point" },
  "f64": { signature: "f64", description: "Double-precision 64-bit floating point" },
  "bool": { signature: "bool", description: "Boolean type (true or false)" },
  "str": { signature: "str", description: "String type (alias for []u8)" },
  "void": { signature: "void", description: "Void type (represents no value)" },
  // Control flow
  "if": { signature: "if condition stmt [else stmt]", description: "Conditional expression", example: 'if x > 0 { @print("positive"); }' },
  "while": { signature: "while condition stmt", description: "Loop while condition is true", example: "while i < 10 { i = i + 1; }" },
  "for": { signature: "for range stmt", description: "Iterate over a range", example: "for 0..10 { @print(@i); }" },
  "return": { signature: "return [expr]", description: "Return from a function", example: "return x + y;" },
  // Modifiers
  "mut": { signature: "mut", description: "Make a variable mutable", example: "let mut counter = 0;" },
  "pub": { signature: "pub", description: "Make a symbol public (exported)", example: 'pub let API_KEY = "...";' },
  // Operators
  "try": { signature: "try expr", description: "Try an expression that may error", example: "let result = try riskyOperation();" },
  "catch": { signature: "expr catch stmt", description: "Handle errors from try expression", example: 'try riskyOp() catch { @print("error"); }' },
  // Literals
  "true": { signature: "true", description: "Boolean true value" },
  "false": { signature: "false", description: "Boolean false value" },
  "null": { signature: "null", description: "Null value" },
  "und": { signature: "und", description: "Undefined value" }
};
var BUILTIN_DOCS = {
  "@print": "```kemet\nfn @print(text: str) -> void\n```\n\nBuilt-in function to print text to output.",
  "@i": "```kemet\n@i: usize\n```\n\nLoop iteration index (available in `for` loops).",
  "self": "```kemet\nself\n```\n\nReference to the current instance (available in struct methods)."
};
var HoverHandler = class {
  constructor(connection, documents, projects) {
    this.connection = connection;
    this.documents = documents;
    this.projects = projects;
    this.setupHandlers();
  }
  setupHandlers() {
    this.connection.onHover((params) => {
      return this.handleHover(params);
    });
  }
  handleHover(params) {
    try {
      console.log("[HOVER] Request received at position:", params.position);
      const document = this.documents.get(params.textDocument.uri);
      if (!document) {
        console.warn("[HOVER] Document not found");
        return null;
      }
      const wordInfo = this.getWordAndSpanAtPosition(document, params.position);
      if (!wordInfo) {
        console.log("[HOVER] No word at position");
        return null;
      }
      const { word, span } = wordInfo;
      console.log(`[HOVER] Word: "${word}"`);
      const allKeywords = [
        ...KEYWORDS2.declarations,
        ...KEYWORDS2.types,
        ...KEYWORDS2.controlFlow,
        ...KEYWORDS2.modifiers,
        ...KEYWORDS2.operators,
        ...KEYWORDS2.literals
      ];
      if (allKeywords.includes(word)) {
        console.log(`[HOVER] Found keyword: ${word}`);
        return this.getKeywordHover(word);
      }
      if (word.startsWith("@") || word === "self") {
        const doc = BUILTIN_DOCS[word];
        if (doc) {
          console.log(`[HOVER] Found builtin: ${word}`);
          return {
            contents: {
              kind: MarkupKind.Markdown,
              value: doc
            }
          };
        }
      }
      return this.getSymbolHover(document, params, word, span);
    } catch (error) {
      console.error("[HOVER] Error:", error);
      if (error instanceof Error) {
        console.error("[HOVER] Stack:", error.stack);
      }
      return null;
    }
  }
  getSymbolHover(document, params, word, span) {
    try {
      const uri = params.textDocument.uri;
      const text = document.getText();
      const { project, modulePath, currentModuleName } = this.determineProject(uri);
      console.log("[HOVER] Running lint...");
      const result = project.lint(text, modulePath);
      const scopeManager = this.getScopeManager(project);
      if (!scopeManager) {
        console.warn("[HOVER] Could not access scope manager");
        return null;
      }
      console.log(`[HOVER] Looking up "${word}" at span:`, span);
      console.log(`[HOVER] Current module: ${currentModuleName}`);
      const symbol = scopeManager.lookupSymbolFromLSP(word, span, currentModuleName);
      if (!symbol) {
        console.log(`[HOVER] Symbol "${word}" not found`);
        return null;
      }
      console.log(`[HOVER] Found symbol: ${word} (${symbol.kind})`);
      return this.formatSymbolHover(symbol);
    } catch (error) {
      console.error("[HOVER] Error getting symbol hover:", error);
      return null;
    }
  }
  getWordAndSpanAtPosition(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    let start = offset;
    let end = offset;
    while (start > 0 && /[a-zA-Z0-9_@]/.test(text[start - 1])) {
      start--;
    }
    while (end < text.length && /[a-zA-Z0-9_@]/.test(text[end])) {
      end++;
    }
    if (start === end) {
      return null;
    }
    const word = text.substring(start, end);
    const span = { start, end };
    return { word, span };
  }
  determineProject(uri) {
    if (uri.startsWith("file://")) {
      try {
        const filePath = fileURLToPath3(uri);
        const relative5 = Path4.relative(this.projects.main.rootPath, filePath);
        const isInProject = !relative5.startsWith("..") && !Path4.isAbsolute(relative5);
        if (isInProject && filePath.endsWith(".k")) {
          const moduleName = Path4.basename(filePath, ".k");
          return {
            project: this.projects.main,
            modulePath: filePath,
            currentModuleName: moduleName
          };
        }
      } catch (e) {
        console.warn("[HOVER] Error determining project:", e);
      }
    }
    return {
      project: this.projects.anonymous,
      currentModuleName: "main"
    };
  }
  getScopeManager(project) {
    var _a, _b, _c, _d;
    if (project.analyzer) {
      return (_b = (_a = project.analyzer.config) == null ? void 0 : _a.services) == null ? void 0 : _b.scopeManager;
    }
    const analyzer = project._analyzer || project.analyzer;
    if (analyzer) {
      return (_d = (_c = analyzer.config) == null ? void 0 : _c.services) == null ? void 0 : _d.scopeManager;
    }
    if (typeof project.getScopeManager === "function") {
      return project.getScopeManager();
    }
    return null;
  }
  getKeywordHover(keyword) {
    const doc = KEYWORD_DOCS2[keyword];
    if (!doc) return null;
    const parts = [];
    const keywordType = KEYWORDS2.types.includes(keyword) ? "type" : "keyword";
    parts.push(`**${keyword}** (${keywordType})`);
    parts.push("");
    parts.push("```kemet");
    parts.push(doc.signature);
    parts.push("```");
    parts.push("");
    parts.push(doc.description);
    if (doc.example) {
      parts.push("");
      parts.push("**Example:**");
      parts.push("```kemet");
      parts.push(doc.example);
      parts.push("```");
    }
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: parts.join("\n")
      }
    };
  }
  formatSymbolHover(symbol) {
    var _a, _b, _c, _d, _e;
    const parts = [];
    const kindName = symbol.kind.toLowerCase();
    parts.push(`**${symbol.name}** (${kindName})`);
    parts.push("");
    if (symbol.kind === "Function") {
      parts.push("```kemet");
      const visibility = symbol.visibility.kind === "Public" ? "pub " : "";
      const metadata = symbol.metadata || {};
      const params = metadata.params || [];
      const returnType = metadata.returnType ? this.formatType(metadata.returnType) : "void";
      const errorType = metadata.errorType ? this.formatType(metadata.errorType) : null;
      const paramStrs = params.map((p) => {
        var _a2;
        const mut = ((_a2 = p.mutability) == null ? void 0 : _a2.kind) === "Mutable" ? "mut " : "";
        return `${mut}${p.name}: ${p.type ? this.formatType(p.type) : "unknown"}`;
      });
      const errorPart = errorType ? `${errorType}!` : "";
      parts.push(`${visibility}fn ${symbol.name}(${paramStrs.join(", ")}) -> ${errorPart}${returnType}`);
      parts.push("```");
    } else if (symbol.kind === "Variable" || symbol.kind === "Parameter") {
      parts.push("```kemet");
      const visibility = ((_a = symbol.visibility) == null ? void 0 : _a.kind) === "Public" ? "pub " : "";
      const mutability = ((_b = symbol.mutability) == null ? void 0 : _b.kind) === "Mutable" ? "mut " : "";
      const typeStr = symbol.type ? this.formatType(symbol.type) : "unknown";
      parts.push(`${visibility}let ${mutability}${symbol.name}: ${typeStr}`);
      parts.push("```");
    }
    const info = [];
    if (((_c = symbol.visibility) == null ? void 0 : _c.kind) === "Public") info.push("**public**");
    if (((_d = symbol.mutability) == null ? void 0 : _d.kind) === "Mutable") info.push("**mutable**");
    if (symbol.isExported) info.push("**exported**");
    if ((_e = symbol.metadata) == null ? void 0 : _e.isBuiltin) info.push("**built-in**");
    if (info.length > 0) {
      parts.push("");
      parts.push(info.join(" \u2022 "));
    }
    if (symbol.module) {
      parts.push("");
      parts.push(`Module: \`${symbol.module}\``);
    }
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: parts.join("\n")
      }
    };
  }
  formatType(type) {
    var _a, _b, _c;
    if (!type || !type.kind) return "unknown";
    switch (type.kind) {
      case "i8":
      case "i16":
      case "i32":
      case "i64":
      case "u8":
      case "u16":
      case "u32":
      case "u64":
      case "f32":
      case "f64":
      case "bool":
      case "void":
      case "str":
        return type.kind;
      case "pointer":
        return `*${this.formatType((_a = type.getPointer()) == null ? void 0 : _a.target)}`;
      case "array":
        return `[]${this.formatType((_b = type.getArray()) == null ? void 0 : _b.target)}`;
      case "optional":
        return `?${this.formatType((_c = type.getOptional()) == null ? void 0 : _c.target)}`;
      case "function":
        return "fn";
      case "struct":
        return "struct";
      case "enum":
        return "enum";
      default:
        return type.kind;
    }
  }
};

// lib/utils/settings.ts
var SettingsManager = class {
  constructor(connection) {
    this.hasConfigurationCapability = true;
    this.documentSettings = /* @__PURE__ */ new Map();
    this.defaultSettings = {
      path: "",
      showWarnings: true,
      showInfos: true,
      maxDiagnostics: 100,
      enableMetrics: false
    };
    this.connection = connection;
    this.globalSettings = this.defaultSettings;
  }
  setConfigurationCapability(hasCapability) {
    this.hasConfigurationCapability = hasCapability;
  }
  getDocumentSettings(resource) {
    if (!this.hasConfigurationCapability) {
      return Promise.resolve(this.globalSettings);
    }
    let result = this.documentSettings.get(resource);
    if (!result) {
      result = this.connection.workspace.getConfiguration({
        scopeUri: resource,
        section: "kemet"
      });
      this.documentSettings.set(resource, result);
    }
    return result;
  }
  clearDocumentSettings(resource) {
    this.documentSettings.delete(resource);
  }
  handleConfigurationChange(change) {
    if (this.hasConfigurationCapability) {
      this.documentSettings.clear();
    } else {
      this.globalSettings = change.settings.kemet || this.defaultSettings;
    }
  }
  clearAllSettings() {
    this.documentSettings.clear();
  }
};

// lib/utils/metrics.ts
var MetricsHandler = class {
  constructor(connection, projects, serverMetrics) {
    this.connection = connection;
    this.projects = projects;
    this.serverMetrics = serverMetrics;
    this.setupHandlers();
  }
  setupHandlers() {
  }
};

// lib/lsp.ts
var KemetLSP = class {
  constructor(connection, documents, config) {
    // Projects
    this.projects = null;
    // Capabilities
    this.hasConfigurationCapability = true;
    this.hasWorkspaceFolderCapability = false;
    // Server metrics
    this.serverMetrics = {
      totalValidations: 0,
      totalErrors: 0,
      averageValidationTime: 0,
      cacheHitRate: 0
    };
    this.connection = connection;
    this.documents = documents;
    this.config = config;
    this.initializeProjects();
    this.initializeHandlers();
  }
  initializeProjects() {
    try {
      console.log("[LSP] Initializing projects...");
      const mainProjectConfig = Project.loadConfigFromPath(this.config.rootPath);
      console.log("[LSP] Config loaded:", mainProjectConfig.name || "anonymous");
      const mainProject = Project.create(
        this.config.rootPath,
        {
          config: mainProjectConfig,
          syntax: this.config.syntax,
          isAnonymous: false
        }
      );
      console.log("[LSP] Main project created");
      const anonProject = Project.createAnonymous(this.config.syntax);
      console.log("[LSP] Anonymous project created");
      this.projects = { main: mainProject, anonymous: anonProject };
      this.projects.main.initializeProgram();
      console.log("[LSP] Program initialized");
    } catch (error) {
      console.error("[LSP] Failed to initialize projects:", error);
      throw error;
    }
  }
  initializeHandlers() {
    if (!this.projects) {
      throw new Error("Projects must be initialized before handlers");
    }
    console.log("[LSP] Initializing feature handlers...");
    this.settingsManager = new SettingsManager(this.connection);
    this.diagnosticsHandler = new DiagnosticsHandler(
      this.connection,
      this.documents,
      this.projects,
      this.settingsManager,
      this.serverMetrics
    );
    this.completionHandler = new CompletionHandler(
      this.connection,
      this.documents,
      this.projects
    );
    this.hoverHandler = new HoverHandler(
      this.connection,
      this.documents,
      this.projects
    );
    this.metricsHandler = new MetricsHandler(
      this.connection,
      this.projects,
      this.serverMetrics
    );
    console.log("[LSP] Feature handlers initialized");
  }
  start() {
    this.setupConnectionHandlers();
    this.setupDocumentHandlers();
    this.documents.listen(this.connection);
    this.connection.listen();
    console.log("[LSP] Server is now listening for requests");
  }
  setupConnectionHandlers() {
    this.connection.onInitialize((params) => {
      return this.handleInitialize(params);
    });
    this.connection.onInitialized(() => {
      this.handleInitialized();
    });
    this.connection.onDidChangeConfiguration((change) => {
      this.settingsManager.handleConfigurationChange(change);
      this.connection.languages.diagnostics.refresh();
    });
    this.connection.onDidChangeWatchedFiles((_change) => {
      console.log("[LSP] Watched file change detected");
      this.connection.languages.diagnostics.refresh();
    });
    this.connection.onShutdown(() => {
      this.handleShutdown();
    });
    this.connection.onExit(() => {
      console.log("[LSP] Server exiting");
      process.exit(0);
    });
  }
  setupDocumentHandlers() {
    this.documents.onDidOpen((e) => __async(this, null, function* () {
      console.log(`[LSP] Document opened: ${e.document.uri}`);
      this.connection.languages.diagnostics.refresh();
    }));
    this.documents.onDidClose((e) => {
      this.settingsManager.clearDocumentSettings(e.document.uri);
      this.diagnosticsHandler.clearInflightValidation(e.document.uri);
    });
    this.documents.onDidChangeContent((change) => __async(this, null, function* () {
      if (this.projects) {
        this.connection.languages.diagnostics.refresh();
      }
    }));
  }
  handleInitialize(params) {
    var _a, _b;
    try {
      console.log("[LSP] Handling initialization...");
      const capabilities = params.capabilities;
      this.hasConfigurationCapability = !!((_a = capabilities.workspace) == null ? void 0 : _a.configuration);
      this.hasWorkspaceFolderCapability = !!((_b = capabilities.workspace) == null ? void 0 : _b.workspaceFolders);
      this.settingsManager.setConfigurationCapability(this.hasConfigurationCapability);
      const result = {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          completionProvider: {
            resolveProvider: true,
            triggerCharacters: [".", ":", "@", " "]
          },
          diagnosticProvider: {
            interFileDependencies: false,
            workspaceDiagnostics: false
          },
          hoverProvider: true
        }
      };
      if (this.hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
          workspaceFolders: {
            supported: true
          }
        };
      }
      console.log("[LSP] Initialization complete");
      return result;
    } catch (e) {
      console.error("[LSP] Error during initialization:", e);
      throw e;
    }
  }
  handleInitialized() {
    try {
      if (this.hasConfigurationCapability) {
        this.connection.client.register(DidChangeConfigurationNotification.type, void 0);
      }
      if (this.hasWorkspaceFolderCapability) {
        this.connection.workspace.onDidChangeWorkspaceFolders((_event) => {
          console.log("[LSP] Workspace folder change event received");
        });
      }
      this.connection.window.showInformationMessage("Kemet Language Server initialized successfully!");
    } catch (e) {
      console.error("[LSP] Error in onInitialized:", e);
    }
  }
  handleShutdown() {
    try {
      console.log("[LSP] Shutdown requested");
      if (this.projects) {
        console.log("[LSP] Final metrics:", {
          server: this.serverMetrics,
          mainProject: this.projects.main.getMetrics(),
          anonymousProject: this.projects.anonymous.getMetrics()
        });
        this.projects.main.destroy();
        this.projects.anonymous.destroy();
      }
      console.log("[LSP] Cleanup complete");
    } catch (e) {
      console.error("[LSP] Shutdown error:", e);
    }
  }
  getProjects() {
    return this.projects;
  }
  getServerMetrics() {
    return this.serverMetrics;
  }
};
export {
  KemetLSP
};
//# sourceMappingURL=lsp.mjs.map