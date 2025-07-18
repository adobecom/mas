function R(r) {
    this.content = r;
}
R.prototype = {
    constructor: R,
    find: function (r) {
        for (var e = 0; e < this.content.length; e += 2) if (this.content[e] === r) return e;
        return -1;
    },
    get: function (r) {
        var e = this.find(r);
        return e == -1 ? void 0 : this.content[e + 1];
    },
    update: function (r, e, t) {
        var n = t && t != r ? this.remove(t) : this,
            i = n.find(r),
            s = n.content.slice();
        return i == -1 ? s.push(t || r, e) : ((s[i + 1] = e), t && (s[i] = t)), new R(s);
    },
    remove: function (r) {
        var e = this.find(r);
        if (e == -1) return this;
        var t = this.content.slice();
        return t.splice(e, 2), new R(t);
    },
    addToStart: function (r, e) {
        return new R([r, e].concat(this.remove(r).content));
    },
    addToEnd: function (r, e) {
        var t = this.remove(r).content.slice();
        return t.push(r, e), new R(t);
    },
    addBefore: function (r, e, t) {
        var n = this.remove(e),
            i = n.content.slice(),
            s = n.find(r);
        return i.splice(s == -1 ? i.length : s, 0, e, t), new R(i);
    },
    forEach: function (r) {
        for (var e = 0; e < this.content.length; e += 2) r(this.content[e], this.content[e + 1]);
    },
    prepend: function (r) {
        return (r = R.from(r)), r.size ? new R(r.content.concat(this.subtract(r).content)) : this;
    },
    append: function (r) {
        return (r = R.from(r)), r.size ? new R(this.subtract(r).content.concat(r.content)) : this;
    },
    subtract: function (r) {
        var e = this;
        r = R.from(r);
        for (var t = 0; t < r.content.length; t += 2) e = e.remove(r.content[t]);
        return e;
    },
    toObject: function () {
        var r = {};
        return (
            this.forEach(function (e, t) {
                r[e] = t;
            }),
            r
        );
    },
    get size() {
        return this.content.length >> 1;
    },
};
R.from = function (r) {
    if (r instanceof R) return r;
    var e = [];
    if (r) for (var t in r) e.push(t, r[t]);
    return new R(e);
};
var en = R;
function br(r, e, t) {
    for (let n = 0; ; n++) {
        if (n == r.childCount || n == e.childCount) return r.childCount == e.childCount ? null : t;
        let i = r.child(n),
            s = e.child(n);
        if (i == s) {
            t += i.nodeSize;
            continue;
        }
        if (!i.sameMarkup(s)) return t;
        if (i.isText && i.text != s.text) {
            for (let o = 0; i.text[o] == s.text[o]; o++) t++;
            return t;
        }
        if (i.content.size || s.content.size) {
            let o = br(i.content, s.content, t + 1);
            if (o != null) return o;
        }
        t += i.nodeSize;
    }
}
function Sr(r, e, t, n) {
    for (let i = r.childCount, s = e.childCount; ; ) {
        if (i == 0 || s == 0) return i == s ? null : { a: t, b: n };
        let o = r.child(--i),
            l = e.child(--s),
            a = o.nodeSize;
        if (o == l) {
            (t -= a), (n -= a);
            continue;
        }
        if (!o.sameMarkup(l)) return { a: t, b: n };
        if (o.isText && o.text != l.text) {
            let f = 0,
                c = Math.min(o.text.length, l.text.length);
            for (; f < c && o.text[o.text.length - f - 1] == l.text[l.text.length - f - 1]; ) f++, t--, n--;
            return { a: t, b: n };
        }
        if (o.content.size || l.content.size) {
            let f = Sr(o.content, l.content, t - 1, n - 1);
            if (f) return f;
        }
        (t -= a), (n -= a);
    }
}
var y = class r {
    constructor(e, t) {
        if (((this.content = e), (this.size = t || 0), t == null))
            for (let n = 0; n < e.length; n++) this.size += e[n].nodeSize;
    }
    nodesBetween(e, t, n, i = 0, s) {
        for (let o = 0, l = 0; l < t; o++) {
            let a = this.content[o],
                f = l + a.nodeSize;
            if (f > e && n(a, i + l, s || null, o) !== !1 && a.content.size) {
                let c = l + 1;
                a.nodesBetween(Math.max(0, e - c), Math.min(a.content.size, t - c), n, i + c);
            }
            l = f;
        }
    }
    descendants(e) {
        this.nodesBetween(0, this.size, e);
    }
    textBetween(e, t, n, i) {
        let s = '',
            o = !0;
        return (
            this.nodesBetween(
                e,
                t,
                (l, a) => {
                    let f = l.isText
                        ? l.text.slice(Math.max(e, a) - a, t - a)
                        : l.isLeaf
                          ? i
                              ? typeof i == 'function'
                                  ? i(l)
                                  : i
                              : l.type.spec.leafText
                                ? l.type.spec.leafText(l)
                                : ''
                          : '';
                    l.isBlock && ((l.isLeaf && f) || l.isTextblock) && n && (o ? (o = !1) : (s += n)), (s += f);
                },
                0,
            ),
            s
        );
    }
    append(e) {
        if (!e.size) return this;
        if (!this.size) return e;
        let t = this.lastChild,
            n = e.firstChild,
            i = this.content.slice(),
            s = 0;
        for (
            t.isText && t.sameMarkup(n) && ((i[i.length - 1] = t.withText(t.text + n.text)), (s = 1));
            s < e.content.length;
            s++
        )
            i.push(e.content[s]);
        return new r(i, this.size + e.size);
    }
    cut(e, t = this.size) {
        if (e == 0 && t == this.size) return this;
        let n = [],
            i = 0;
        if (t > e)
            for (let s = 0, o = 0; o < t; s++) {
                let l = this.content[s],
                    a = o + l.nodeSize;
                a > e &&
                    ((o < e || a > t) &&
                        (l.isText
                            ? (l = l.cut(Math.max(0, e - o), Math.min(l.text.length, t - o)))
                            : (l = l.cut(Math.max(0, e - o - 1), Math.min(l.content.size, t - o - 1)))),
                    n.push(l),
                    (i += l.nodeSize)),
                    (o = a);
            }
        return new r(n, i);
    }
    cutByIndex(e, t) {
        return e == t ? r.empty : e == 0 && t == this.content.length ? this : new r(this.content.slice(e, t));
    }
    replaceChild(e, t) {
        let n = this.content[e];
        if (n == t) return this;
        let i = this.content.slice(),
            s = this.size + t.nodeSize - n.nodeSize;
        return (i[e] = t), new r(i, s);
    }
    addToStart(e) {
        return new r([e].concat(this.content), this.size + e.nodeSize);
    }
    addToEnd(e) {
        return new r(this.content.concat(e), this.size + e.nodeSize);
    }
    eq(e) {
        if (this.content.length != e.content.length) return !1;
        for (let t = 0; t < this.content.length; t++) if (!this.content[t].eq(e.content[t])) return !1;
        return !0;
    }
    get firstChild() {
        return this.content.length ? this.content[0] : null;
    }
    get lastChild() {
        return this.content.length ? this.content[this.content.length - 1] : null;
    }
    get childCount() {
        return this.content.length;
    }
    child(e) {
        let t = this.content[e];
        if (!t) throw new RangeError('Index ' + e + ' out of range for ' + this);
        return t;
    }
    maybeChild(e) {
        return this.content[e] || null;
    }
    forEach(e) {
        for (let t = 0, n = 0; t < this.content.length; t++) {
            let i = this.content[t];
            e(i, n, t), (n += i.nodeSize);
        }
    }
    findDiffStart(e, t = 0) {
        return br(this, e, t);
    }
    findDiffEnd(e, t = this.size, n = e.size) {
        return Sr(this, e, t, n);
    }
    findIndex(e, t = -1) {
        if (e == 0) return Mt(0, e);
        if (e == this.size) return Mt(this.content.length, e);
        if (e > this.size || e < 0) throw new RangeError(`Position ${e} outside of fragment (${this})`);
        for (let n = 0, i = 0; ; n++) {
            let s = this.child(n),
                o = i + s.nodeSize;
            if (o >= e) return o == e || t > 0 ? Mt(n + 1, o) : Mt(n, i);
            i = o;
        }
    }
    toString() {
        return '<' + this.toStringInner() + '>';
    }
    toStringInner() {
        return this.content.join(', ');
    }
    toJSON() {
        return this.content.length ? this.content.map((e) => e.toJSON()) : null;
    }
    static fromJSON(e, t) {
        if (!t) return r.empty;
        if (!Array.isArray(t)) throw new RangeError('Invalid input for Fragment.fromJSON');
        return new r(t.map(e.nodeFromJSON));
    }
    static fromArray(e) {
        if (!e.length) return r.empty;
        let t,
            n = 0;
        for (let i = 0; i < e.length; i++) {
            let s = e[i];
            (n += s.nodeSize),
                i && s.isText && e[i - 1].sameMarkup(s)
                    ? (t || (t = e.slice(0, i)), (t[t.length - 1] = s.withText(t[t.length - 1].text + s.text)))
                    : t && t.push(s);
        }
        return new r(t || e, n);
    }
    static from(e) {
        if (!e) return r.empty;
        if (e instanceof r) return e;
        if (Array.isArray(e)) return this.fromArray(e);
        if (e.attrs) return new r([e], e.nodeSize);
        throw new RangeError(
            'Can not convert ' +
                e +
                ' to a Fragment' +
                (e.nodesBetween ? ' (looks like multiple versions of prosemirror-model were loaded)' : ''),
        );
    }
};
y.empty = new y([], 0);
var tn = { index: 0, offset: 0 };
function Mt(r, e) {
    return (tn.index = r), (tn.offset = e), tn;
}
function Ot(r, e) {
    if (r === e) return !0;
    if (!(r && typeof r == 'object') || !(e && typeof e == 'object')) return !1;
    let t = Array.isArray(r);
    if (Array.isArray(e) != t) return !1;
    if (t) {
        if (r.length != e.length) return !1;
        for (let n = 0; n < r.length; n++) if (!Ot(r[n], e[n])) return !1;
    } else {
        for (let n in r) if (!(n in e) || !Ot(r[n], e[n])) return !1;
        for (let n in e) if (!(n in r)) return !1;
    }
    return !0;
}
var C = class r {
    constructor(e, t) {
        (this.type = e), (this.attrs = t);
    }
    addToSet(e) {
        let t,
            n = !1;
        for (let i = 0; i < e.length; i++) {
            let s = e[i];
            if (this.eq(s)) return e;
            if (this.type.excludes(s.type)) t || (t = e.slice(0, i));
            else {
                if (s.type.excludes(this.type)) return e;
                !n && s.type.rank > this.type.rank && (t || (t = e.slice(0, i)), t.push(this), (n = !0)), t && t.push(s);
            }
        }
        return t || (t = e.slice()), n || t.push(this), t;
    }
    removeFromSet(e) {
        for (let t = 0; t < e.length; t++) if (this.eq(e[t])) return e.slice(0, t).concat(e.slice(t + 1));
        return e;
    }
    isInSet(e) {
        for (let t = 0; t < e.length; t++) if (this.eq(e[t])) return !0;
        return !1;
    }
    eq(e) {
        return this == e || (this.type == e.type && Ot(this.attrs, e.attrs));
    }
    toJSON() {
        let e = { type: this.type.name };
        for (let t in this.attrs) {
            e.attrs = this.attrs;
            break;
        }
        return e;
    }
    static fromJSON(e, t) {
        if (!t) throw new RangeError('Invalid input for Mark.fromJSON');
        let n = e.marks[t.type];
        if (!n) throw new RangeError(`There is no mark type ${t.type} in this schema`);
        let i = n.create(t.attrs);
        return n.checkAttrs(i.attrs), i;
    }
    static sameSet(e, t) {
        if (e == t) return !0;
        if (e.length != t.length) return !1;
        for (let n = 0; n < e.length; n++) if (!e[n].eq(t[n])) return !1;
        return !0;
    }
    static setFrom(e) {
        if (!e || (Array.isArray(e) && e.length == 0)) return r.none;
        if (e instanceof r) return [e];
        let t = e.slice();
        return t.sort((n, i) => n.type.rank - i.type.rank), t;
    }
};
C.none = [];
var ke = class extends Error {},
    x = class r {
        constructor(e, t, n) {
            (this.content = e), (this.openStart = t), (this.openEnd = n);
        }
        get size() {
            return this.content.size - this.openStart - this.openEnd;
        }
        insertAt(e, t) {
            let n = Mr(this.content, e + this.openStart, t);
            return n && new r(n, this.openStart, this.openEnd);
        }
        removeBetween(e, t) {
            return new r(kr(this.content, e + this.openStart, t + this.openStart), this.openStart, this.openEnd);
        }
        eq(e) {
            return this.content.eq(e.content) && this.openStart == e.openStart && this.openEnd == e.openEnd;
        }
        toString() {
            return this.content + '(' + this.openStart + ',' + this.openEnd + ')';
        }
        toJSON() {
            if (!this.content.size) return null;
            let e = { content: this.content.toJSON() };
            return this.openStart > 0 && (e.openStart = this.openStart), this.openEnd > 0 && (e.openEnd = this.openEnd), e;
        }
        static fromJSON(e, t) {
            if (!t) return r.empty;
            let n = t.openStart || 0,
                i = t.openEnd || 0;
            if (typeof n != 'number' || typeof i != 'number') throw new RangeError('Invalid input for Slice.fromJSON');
            return new r(y.fromJSON(e, t.content), n, i);
        }
        static maxOpen(e, t = !0) {
            let n = 0,
                i = 0;
            for (let s = e.firstChild; s && !s.isLeaf && (t || !s.type.spec.isolating); s = s.firstChild) n++;
            for (let s = e.lastChild; s && !s.isLeaf && (t || !s.type.spec.isolating); s = s.lastChild) i++;
            return new r(e, n, i);
        }
    };
x.empty = new x(y.empty, 0, 0);
function kr(r, e, t) {
    let { index: n, offset: i } = r.findIndex(e),
        s = r.maybeChild(n),
        { index: o, offset: l } = r.findIndex(t);
    if (i == e || s.isText) {
        if (l != t && !r.child(o).isText) throw new RangeError('Removing non-flat range');
        return r.cut(0, e).append(r.cut(t));
    }
    if (n != o) throw new RangeError('Removing non-flat range');
    return r.replaceChild(n, s.copy(kr(s.content, e - i - 1, t - i - 1)));
}
function Mr(r, e, t, n) {
    let { index: i, offset: s } = r.findIndex(e),
        o = r.maybeChild(i);
    if (s == e || o.isText) return n && !n.canReplace(i, i, t) ? null : r.cut(0, e).append(t).append(r.cut(e));
    let l = Mr(o.content, e - s - 1, t);
    return l && r.replaceChild(i, o.copy(l));
}
function As(r, e, t) {
    if (t.openStart > r.depth) throw new ke('Inserted content deeper than insertion position');
    if (r.depth - t.openStart != e.depth - t.openEnd) throw new ke('Inconsistent open depths');
    return Cr(r, e, t, 0);
}
function Cr(r, e, t, n) {
    let i = r.index(n),
        s = r.node(n);
    if (i == e.index(n) && n < r.depth - t.openStart) {
        let o = Cr(r, e, t, n + 1);
        return s.copy(s.content.replaceChild(i, o));
    } else if (t.content.size)
        if (!t.openStart && !t.openEnd && r.depth == n && e.depth == n) {
            let o = r.parent,
                l = o.content;
            return Se(o, l.cut(0, r.parentOffset).append(t.content).append(l.cut(e.parentOffset)));
        } else {
            let { start: o, end: l } = Is(t, r);
            return Se(s, Nr(r, o, l, e, n));
        }
    else return Se(s, Nt(r, e, n));
}
function Or(r, e) {
    if (!e.type.compatibleContent(r.type)) throw new ke('Cannot join ' + e.type.name + ' onto ' + r.type.name);
}
function rn(r, e, t) {
    let n = r.node(t);
    return Or(n, e.node(t)), n;
}
function be(r, e) {
    let t = e.length - 1;
    t >= 0 && r.isText && r.sameMarkup(e[t]) ? (e[t] = r.withText(e[t].text + r.text)) : e.push(r);
}
function Ye(r, e, t, n) {
    let i = (e || r).node(t),
        s = 0,
        o = e ? e.index(t) : i.childCount;
    r && ((s = r.index(t)), r.depth > t ? s++ : r.textOffset && (be(r.nodeAfter, n), s++));
    for (let l = s; l < o; l++) be(i.child(l), n);
    e && e.depth == t && e.textOffset && be(e.nodeBefore, n);
}
function Se(r, e) {
    return r.type.checkContent(e), r.copy(e);
}
function Nr(r, e, t, n, i) {
    let s = r.depth > i && rn(r, e, i + 1),
        o = n.depth > i && rn(t, n, i + 1),
        l = [];
    return (
        Ye(null, r, i, l),
        s && o && e.index(i) == t.index(i)
            ? (Or(s, o), be(Se(s, Nr(r, e, t, n, i + 1)), l))
            : (s && be(Se(s, Nt(r, e, i + 1)), l), Ye(e, t, i, l), o && be(Se(o, Nt(t, n, i + 1)), l)),
        Ye(n, null, i, l),
        new y(l)
    );
}
function Nt(r, e, t) {
    let n = [];
    if ((Ye(null, r, t, n), r.depth > t)) {
        let i = rn(r, e, t + 1);
        be(Se(i, Nt(r, e, t + 1)), n);
    }
    return Ye(e, null, t, n), new y(n);
}
function Is(r, e) {
    let t = e.depth - r.openStart,
        i = e.node(t).copy(r.content);
    for (let s = t - 1; s >= 0; s--) i = e.node(s).copy(y.from(i));
    return { start: i.resolveNoCache(r.openStart + t), end: i.resolveNoCache(i.content.size - r.openEnd - t) };
}
var wt = class r {
        constructor(e, t, n) {
            (this.pos = e), (this.path = t), (this.parentOffset = n), (this.depth = t.length / 3 - 1);
        }
        resolveDepth(e) {
            return e == null ? this.depth : e < 0 ? this.depth + e : e;
        }
        get parent() {
            return this.node(this.depth);
        }
        get doc() {
            return this.node(0);
        }
        node(e) {
            return this.path[this.resolveDepth(e) * 3];
        }
        index(e) {
            return this.path[this.resolveDepth(e) * 3 + 1];
        }
        indexAfter(e) {
            return (e = this.resolveDepth(e)), this.index(e) + (e == this.depth && !this.textOffset ? 0 : 1);
        }
        start(e) {
            return (e = this.resolveDepth(e)), e == 0 ? 0 : this.path[e * 3 - 1] + 1;
        }
        end(e) {
            return (e = this.resolveDepth(e)), this.start(e) + this.node(e).content.size;
        }
        before(e) {
            if (((e = this.resolveDepth(e)), !e)) throw new RangeError('There is no position before the top-level node');
            return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1];
        }
        after(e) {
            if (((e = this.resolveDepth(e)), !e)) throw new RangeError('There is no position after the top-level node');
            return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1] + this.path[e * 3].nodeSize;
        }
        get textOffset() {
            return this.pos - this.path[this.path.length - 1];
        }
        get nodeAfter() {
            let e = this.parent,
                t = this.index(this.depth);
            if (t == e.childCount) return null;
            let n = this.pos - this.path[this.path.length - 1],
                i = e.child(t);
            return n ? e.child(t).cut(n) : i;
        }
        get nodeBefore() {
            let e = this.index(this.depth),
                t = this.pos - this.path[this.path.length - 1];
            return t ? this.parent.child(e).cut(0, t) : e == 0 ? null : this.parent.child(e - 1);
        }
        posAtIndex(e, t) {
            t = this.resolveDepth(t);
            let n = this.path[t * 3],
                i = t == 0 ? 0 : this.path[t * 3 - 1] + 1;
            for (let s = 0; s < e; s++) i += n.child(s).nodeSize;
            return i;
        }
        marks() {
            let e = this.parent,
                t = this.index();
            if (e.content.size == 0) return C.none;
            if (this.textOffset) return e.child(t).marks;
            let n = e.maybeChild(t - 1),
                i = e.maybeChild(t);
            if (!n) {
                let l = n;
                (n = i), (i = l);
            }
            let s = n.marks;
            for (var o = 0; o < s.length; o++)
                s[o].type.spec.inclusive === !1 && (!i || !s[o].isInSet(i.marks)) && (s = s[o--].removeFromSet(s));
            return s;
        }
        marksAcross(e) {
            let t = this.parent.maybeChild(this.index());
            if (!t || !t.isInline) return null;
            let n = t.marks,
                i = e.parent.maybeChild(e.index());
            for (var s = 0; s < n.length; s++)
                n[s].type.spec.inclusive === !1 && (!i || !n[s].isInSet(i.marks)) && (n = n[s--].removeFromSet(n));
            return n;
        }
        sharedDepth(e) {
            for (let t = this.depth; t > 0; t--) if (this.start(t) <= e && this.end(t) >= e) return t;
            return 0;
        }
        blockRange(e = this, t) {
            if (e.pos < this.pos) return e.blockRange(this);
            for (let n = this.depth - (this.parent.inlineContent || this.pos == e.pos ? 1 : 0); n >= 0; n--)
                if (e.pos <= this.end(n) && (!t || t(this.node(n)))) return new Me(this, e, n);
            return null;
        }
        sameParent(e) {
            return this.pos - this.parentOffset == e.pos - e.parentOffset;
        }
        max(e) {
            return e.pos > this.pos ? e : this;
        }
        min(e) {
            return e.pos < this.pos ? e : this;
        }
        toString() {
            let e = '';
            for (let t = 1; t <= this.depth; t++) e += (e ? '/' : '') + this.node(t).type.name + '_' + this.index(t - 1);
            return e + ':' + this.parentOffset;
        }
        static resolve(e, t) {
            if (!(t >= 0 && t <= e.content.size)) throw new RangeError('Position ' + t + ' out of range');
            let n = [],
                i = 0,
                s = t;
            for (let o = e; ; ) {
                let { index: l, offset: a } = o.content.findIndex(s),
                    f = s - a;
                if ((n.push(o, l, i + a), !f || ((o = o.child(l)), o.isText))) break;
                (s = f - 1), (i += a + 1);
            }
            return new r(t, n, s);
        }
        static resolveCached(e, t) {
            let n = cr.get(e);
            if (n)
                for (let s = 0; s < n.elts.length; s++) {
                    let o = n.elts[s];
                    if (o.pos == t) return o;
                }
            else cr.set(e, (n = new sn()));
            let i = (n.elts[n.i] = r.resolve(e, t));
            return (n.i = (n.i + 1) % Rs), i;
        }
    },
    sn = class {
        constructor() {
            (this.elts = []), (this.i = 0);
        }
    },
    Rs = 12,
    cr = new WeakMap(),
    Me = class {
        constructor(e, t, n) {
            (this.$from = e), (this.$to = t), (this.depth = n);
        }
        get start() {
            return this.$from.before(this.depth + 1);
        }
        get end() {
            return this.$to.after(this.depth + 1);
        }
        get parent() {
            return this.$from.node(this.depth);
        }
        get startIndex() {
            return this.$from.index(this.depth);
        }
        get endIndex() {
            return this.$to.indexAfter(this.depth);
        }
    },
    zs = Object.create(null),
    X = class r {
        constructor(e, t, n, i = C.none) {
            (this.type = e), (this.attrs = t), (this.marks = i), (this.content = n || y.empty);
        }
        get children() {
            return this.content.content;
        }
        get nodeSize() {
            return this.isLeaf ? 1 : 2 + this.content.size;
        }
        get childCount() {
            return this.content.childCount;
        }
        child(e) {
            return this.content.child(e);
        }
        maybeChild(e) {
            return this.content.maybeChild(e);
        }
        forEach(e) {
            this.content.forEach(e);
        }
        nodesBetween(e, t, n, i = 0) {
            this.content.nodesBetween(e, t, n, i, this);
        }
        descendants(e) {
            this.nodesBetween(0, this.content.size, e);
        }
        get textContent() {
            return this.isLeaf && this.type.spec.leafText
                ? this.type.spec.leafText(this)
                : this.textBetween(0, this.content.size, '');
        }
        textBetween(e, t, n, i) {
            return this.content.textBetween(e, t, n, i);
        }
        get firstChild() {
            return this.content.firstChild;
        }
        get lastChild() {
            return this.content.lastChild;
        }
        eq(e) {
            return this == e || (this.sameMarkup(e) && this.content.eq(e.content));
        }
        sameMarkup(e) {
            return this.hasMarkup(e.type, e.attrs, e.marks);
        }
        hasMarkup(e, t, n) {
            return this.type == e && Ot(this.attrs, t || e.defaultAttrs || zs) && C.sameSet(this.marks, n || C.none);
        }
        copy(e = null) {
            return e == this.content ? this : new r(this.type, this.attrs, e, this.marks);
        }
        mark(e) {
            return e == this.marks ? this : new r(this.type, this.attrs, this.content, e);
        }
        cut(e, t = this.content.size) {
            return e == 0 && t == this.content.size ? this : this.copy(this.content.cut(e, t));
        }
        slice(e, t = this.content.size, n = !1) {
            if (e == t) return x.empty;
            let i = this.resolve(e),
                s = this.resolve(t),
                o = n ? 0 : i.sharedDepth(t),
                l = i.start(o),
                f = i.node(o).content.cut(i.pos - l, s.pos - l);
            return new x(f, i.depth - o, s.depth - o);
        }
        replace(e, t, n) {
            return As(this.resolve(e), this.resolve(t), n);
        }
        nodeAt(e) {
            for (let t = this; ; ) {
                let { index: n, offset: i } = t.content.findIndex(e);
                if (((t = t.maybeChild(n)), !t)) return null;
                if (i == e || t.isText) return t;
                e -= i + 1;
            }
        }
        childAfter(e) {
            let { index: t, offset: n } = this.content.findIndex(e);
            return { node: this.content.maybeChild(t), index: t, offset: n };
        }
        childBefore(e) {
            if (e == 0) return { node: null, index: 0, offset: 0 };
            let { index: t, offset: n } = this.content.findIndex(e);
            if (n < e) return { node: this.content.child(t), index: t, offset: n };
            let i = this.content.child(t - 1);
            return { node: i, index: t - 1, offset: n - i.nodeSize };
        }
        resolve(e) {
            return wt.resolveCached(this, e);
        }
        resolveNoCache(e) {
            return wt.resolve(this, e);
        }
        rangeHasMark(e, t, n) {
            let i = !1;
            return t > e && this.nodesBetween(e, t, (s) => (n.isInSet(s.marks) && (i = !0), !i)), i;
        }
        get isBlock() {
            return this.type.isBlock;
        }
        get isTextblock() {
            return this.type.isTextblock;
        }
        get inlineContent() {
            return this.type.inlineContent;
        }
        get isInline() {
            return this.type.isInline;
        }
        get isText() {
            return this.type.isText;
        }
        get isLeaf() {
            return this.type.isLeaf;
        }
        get isAtom() {
            return this.type.isAtom;
        }
        toString() {
            if (this.type.spec.toDebugString) return this.type.spec.toDebugString(this);
            let e = this.type.name;
            return this.content.size && (e += '(' + this.content.toStringInner() + ')'), wr(this.marks, e);
        }
        contentMatchAt(e) {
            let t = this.type.contentMatch.matchFragment(this.content, 0, e);
            if (!t) throw new Error('Called contentMatchAt on a node with invalid content');
            return t;
        }
        canReplace(e, t, n = y.empty, i = 0, s = n.childCount) {
            let o = this.contentMatchAt(e).matchFragment(n, i, s),
                l = o && o.matchFragment(this.content, t);
            if (!l || !l.validEnd) return !1;
            for (let a = i; a < s; a++) if (!this.type.allowsMarks(n.child(a).marks)) return !1;
            return !0;
        }
        canReplaceWith(e, t, n, i) {
            if (i && !this.type.allowsMarks(i)) return !1;
            let s = this.contentMatchAt(e).matchType(n),
                o = s && s.matchFragment(this.content, t);
            return o ? o.validEnd : !1;
        }
        canAppend(e) {
            return e.content.size
                ? this.canReplace(this.childCount, this.childCount, e.content)
                : this.type.compatibleContent(e.type);
        }
        check() {
            this.type.checkContent(this.content), this.type.checkAttrs(this.attrs);
            let e = C.none;
            for (let t = 0; t < this.marks.length; t++) {
                let n = this.marks[t];
                n.type.checkAttrs(n.attrs), (e = n.addToSet(e));
            }
            if (!C.sameSet(e, this.marks))
                throw new RangeError(
                    `Invalid collection of marks for node ${this.type.name}: ${this.marks.map((t) => t.type.name)}`,
                );
            this.content.forEach((t) => t.check());
        }
        toJSON() {
            let e = { type: this.type.name };
            for (let t in this.attrs) {
                e.attrs = this.attrs;
                break;
            }
            return (
                this.content.size && (e.content = this.content.toJSON()),
                this.marks.length && (e.marks = this.marks.map((t) => t.toJSON())),
                e
            );
        }
        static fromJSON(e, t) {
            if (!t) throw new RangeError('Invalid input for Node.fromJSON');
            let n;
            if (t.marks) {
                if (!Array.isArray(t.marks)) throw new RangeError('Invalid mark data for Node.fromJSON');
                n = t.marks.map(e.markFromJSON);
            }
            if (t.type == 'text') {
                if (typeof t.text != 'string') throw new RangeError('Invalid text node in JSON');
                return e.text(t.text, n);
            }
            let i = y.fromJSON(e, t.content),
                s = e.nodeType(t.type).create(t.attrs, i, n);
            return s.type.checkAttrs(s.attrs), s;
        }
    };
X.prototype.text = void 0;
var on = class r extends X {
    constructor(e, t, n, i) {
        if ((super(e, t, null, i), !n)) throw new RangeError('Empty text nodes are not allowed');
        this.text = n;
    }
    toString() {
        return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : wr(this.marks, JSON.stringify(this.text));
    }
    get textContent() {
        return this.text;
    }
    textBetween(e, t) {
        return this.text.slice(e, t);
    }
    get nodeSize() {
        return this.text.length;
    }
    mark(e) {
        return e == this.marks ? this : new r(this.type, this.attrs, this.text, e);
    }
    withText(e) {
        return e == this.text ? this : new r(this.type, this.attrs, e, this.marks);
    }
    cut(e = 0, t = this.text.length) {
        return e == 0 && t == this.text.length ? this : this.withText(this.text.slice(e, t));
    }
    eq(e) {
        return this.sameMarkup(e) && this.text == e.text;
    }
    toJSON() {
        let e = super.toJSON();
        return (e.text = this.text), e;
    }
};
function wr(r, e) {
    for (let t = r.length - 1; t >= 0; t--) e = r[t].type.name + '(' + e + ')';
    return e;
}
var Ce = class r {
    constructor(e) {
        (this.validEnd = e), (this.next = []), (this.wrapCache = []);
    }
    static parse(e, t) {
        let n = new ln(e, t);
        if (n.next == null) return r.empty;
        let i = Dr(n);
        n.next && n.err('Unexpected trailing text');
        let s = Js(Ls(i));
        return Ws(s, n), s;
    }
    matchType(e) {
        for (let t = 0; t < this.next.length; t++) if (this.next[t].type == e) return this.next[t].next;
        return null;
    }
    matchFragment(e, t = 0, n = e.childCount) {
        let i = this;
        for (let s = t; i && s < n; s++) i = i.matchType(e.child(s).type);
        return i;
    }
    get inlineContent() {
        return this.next.length != 0 && this.next[0].type.isInline;
    }
    get defaultType() {
        for (let e = 0; e < this.next.length; e++) {
            let { type: t } = this.next[e];
            if (!(t.isText || t.hasRequiredAttrs())) return t;
        }
        return null;
    }
    compatible(e) {
        for (let t = 0; t < this.next.length; t++)
            for (let n = 0; n < e.next.length; n++) if (this.next[t].type == e.next[n].type) return !0;
        return !1;
    }
    fillBefore(e, t = !1, n = 0) {
        let i = [this];
        function s(o, l) {
            let a = o.matchFragment(e, n);
            if (a && (!t || a.validEnd)) return y.from(l.map((f) => f.createAndFill()));
            for (let f = 0; f < o.next.length; f++) {
                let { type: c, next: h } = o.next[f];
                if (!(c.isText || c.hasRequiredAttrs()) && i.indexOf(h) == -1) {
                    i.push(h);
                    let u = s(h, l.concat(c));
                    if (u) return u;
                }
            }
            return null;
        }
        return s(this, []);
    }
    findWrapping(e) {
        for (let n = 0; n < this.wrapCache.length; n += 2) if (this.wrapCache[n] == e) return this.wrapCache[n + 1];
        let t = this.computeWrapping(e);
        return this.wrapCache.push(e, t), t;
    }
    computeWrapping(e) {
        let t = Object.create(null),
            n = [{ match: this, type: null, via: null }];
        for (; n.length; ) {
            let i = n.shift(),
                s = i.match;
            if (s.matchType(e)) {
                let o = [];
                for (let l = i; l.type; l = l.via) o.push(l.type);
                return o.reverse();
            }
            for (let o = 0; o < s.next.length; o++) {
                let { type: l, next: a } = s.next[o];
                !l.isLeaf &&
                    !l.hasRequiredAttrs() &&
                    !(l.name in t) &&
                    (!i.type || a.validEnd) &&
                    (n.push({ match: l.contentMatch, type: l, via: i }), (t[l.name] = !0));
            }
        }
        return null;
    }
    get edgeCount() {
        return this.next.length;
    }
    edge(e) {
        if (e >= this.next.length) throw new RangeError(`There's no ${e}th edge in this content match`);
        return this.next[e];
    }
    toString() {
        let e = [];
        function t(n) {
            e.push(n);
            for (let i = 0; i < n.next.length; i++) e.indexOf(n.next[i].next) == -1 && t(n.next[i].next);
        }
        return (
            t(this),
            e.map((n, i) => {
                let s = i + (n.validEnd ? '*' : ' ') + ' ';
                for (let o = 0; o < n.next.length; o++)
                    s += (o ? ', ' : '') + n.next[o].type.name + '->' + e.indexOf(n.next[o].next);
                return s;
            }).join(`
`)
        );
    }
};
Ce.empty = new Ce(!0);
var ln = class {
    constructor(e, t) {
        (this.string = e),
            (this.nodeTypes = t),
            (this.inline = null),
            (this.pos = 0),
            (this.tokens = e.split(/\s*(?=\b|\W|$)/)),
            this.tokens[this.tokens.length - 1] == '' && this.tokens.pop(),
            this.tokens[0] == '' && this.tokens.shift();
    }
    get next() {
        return this.tokens[this.pos];
    }
    eat(e) {
        return this.next == e && (this.pos++ || !0);
    }
    err(e) {
        throw new SyntaxError(e + " (in content expression '" + this.string + "')");
    }
};
function Dr(r) {
    let e = [];
    do e.push(Ps(r));
    while (r.eat('|'));
    return e.length == 1 ? e[0] : { type: 'choice', exprs: e };
}
function Ps(r) {
    let e = [];
    do e.push(Bs(r));
    while (r.next && r.next != ')' && r.next != '|');
    return e.length == 1 ? e[0] : { type: 'seq', exprs: e };
}
function Bs(r) {
    let e = Vs(r);
    for (;;)
        if (r.eat('+')) e = { type: 'plus', expr: e };
        else if (r.eat('*')) e = { type: 'star', expr: e };
        else if (r.eat('?')) e = { type: 'opt', expr: e };
        else if (r.eat('{')) e = Fs(r, e);
        else break;
    return e;
}
function hr(r) {
    /\D/.test(r.next) && r.err("Expected number, got '" + r.next + "'");
    let e = Number(r.next);
    return r.pos++, e;
}
function Fs(r, e) {
    let t = hr(r),
        n = t;
    return (
        r.eat(',') && (r.next != '}' ? (n = hr(r)) : (n = -1)),
        r.eat('}') || r.err('Unclosed braced range'),
        { type: 'range', min: t, max: n, expr: e }
    );
}
function vs(r, e) {
    let t = r.nodeTypes,
        n = t[e];
    if (n) return [n];
    let i = [];
    for (let s in t) {
        let o = t[s];
        o.isInGroup(e) && i.push(o);
    }
    return i.length == 0 && r.err("No node type or group '" + e + "' found"), i;
}
function Vs(r) {
    if (r.eat('(')) {
        let e = Dr(r);
        return r.eat(')') || r.err('Missing closing paren'), e;
    } else if (/\W/.test(r.next)) r.err("Unexpected token '" + r.next + "'");
    else {
        let e = vs(r, r.next).map(
            (t) => (
                r.inline == null ? (r.inline = t.isInline) : r.inline != t.isInline && r.err('Mixing inline and block content'),
                { type: 'name', value: t }
            ),
        );
        return r.pos++, e.length == 1 ? e[0] : { type: 'choice', exprs: e };
    }
}
function Ls(r) {
    let e = [[]];
    return i(s(r, 0), t()), e;
    function t() {
        return e.push([]) - 1;
    }
    function n(o, l, a) {
        let f = { term: a, to: l };
        return e[o].push(f), f;
    }
    function i(o, l) {
        o.forEach((a) => (a.to = l));
    }
    function s(o, l) {
        if (o.type == 'choice') return o.exprs.reduce((a, f) => a.concat(s(f, l)), []);
        if (o.type == 'seq')
            for (let a = 0; ; a++) {
                let f = s(o.exprs[a], l);
                if (a == o.exprs.length - 1) return f;
                i(f, (l = t()));
            }
        else if (o.type == 'star') {
            let a = t();
            return n(l, a), i(s(o.expr, a), a), [n(a)];
        } else if (o.type == 'plus') {
            let a = t();
            return i(s(o.expr, l), a), i(s(o.expr, a), a), [n(a)];
        } else {
            if (o.type == 'opt') return [n(l)].concat(s(o.expr, l));
            if (o.type == 'range') {
                let a = l;
                for (let f = 0; f < o.min; f++) {
                    let c = t();
                    i(s(o.expr, a), c), (a = c);
                }
                if (o.max == -1) i(s(o.expr, a), a);
                else
                    for (let f = o.min; f < o.max; f++) {
                        let c = t();
                        n(a, c), i(s(o.expr, a), c), (a = c);
                    }
                return [n(a)];
            } else {
                if (o.type == 'name') return [n(l, void 0, o.value)];
                throw new Error('Unknown expr type');
            }
        }
    }
}
function Tr(r, e) {
    return e - r;
}
function ur(r, e) {
    let t = [];
    return n(e), t.sort(Tr);
    function n(i) {
        let s = r[i];
        if (s.length == 1 && !s[0].term) return n(s[0].to);
        t.push(i);
        for (let o = 0; o < s.length; o++) {
            let { term: l, to: a } = s[o];
            !l && t.indexOf(a) == -1 && n(a);
        }
    }
}
function Js(r) {
    let e = Object.create(null);
    return t(ur(r, 0));
    function t(n) {
        let i = [];
        n.forEach((o) => {
            r[o].forEach(({ term: l, to: a }) => {
                if (!l) return;
                let f;
                for (let c = 0; c < i.length; c++) i[c][0] == l && (f = i[c][1]);
                ur(r, a).forEach((c) => {
                    f || i.push([l, (f = [])]), f.indexOf(c) == -1 && f.push(c);
                });
            });
        });
        let s = (e[n.join(',')] = new Ce(n.indexOf(r.length - 1) > -1));
        for (let o = 0; o < i.length; o++) {
            let l = i[o][1].sort(Tr);
            s.next.push({ type: i[o][0], next: e[l.join(',')] || t(l) });
        }
        return s;
    }
}
function Ws(r, e) {
    for (let t = 0, n = [r]; t < n.length; t++) {
        let i = n[t],
            s = !i.validEnd,
            o = [];
        for (let l = 0; l < i.next.length; l++) {
            let { type: a, next: f } = i.next[l];
            o.push(a.name), s && !(a.isText || a.hasRequiredAttrs()) && (s = !1), n.indexOf(f) == -1 && n.push(f);
        }
        s &&
            e.err(
                'Only non-generatable nodes (' +
                    o.join(', ') +
                    ') in a required position (see https://prosemirror.net/docs/guide/#generatable)',
            );
    }
}
function Er(r) {
    let e = Object.create(null);
    for (let t in r) {
        let n = r[t];
        if (!n.hasDefault) return null;
        e[t] = n.default;
    }
    return e;
}
function Ar(r, e) {
    let t = Object.create(null);
    for (let n in r) {
        let i = e && e[n];
        if (i === void 0) {
            let s = r[n];
            if (s.hasDefault) i = s.default;
            else throw new RangeError('No value supplied for attribute ' + n);
        }
        t[n] = i;
    }
    return t;
}
function Ir(r, e, t, n) {
    for (let i in e) if (!(i in r)) throw new RangeError(`Unsupported attribute ${i} for ${t} of type ${i}`);
    for (let i in r) {
        let s = r[i];
        s.validate && s.validate(e[i]);
    }
}
function Rr(r, e) {
    let t = Object.create(null);
    if (e) for (let n in e) t[n] = new an(r, n, e[n]);
    return t;
}
var Dt = class r {
    constructor(e, t, n) {
        (this.name = e),
            (this.schema = t),
            (this.spec = n),
            (this.markSet = null),
            (this.groups = n.group ? n.group.split(' ') : []),
            (this.attrs = Rr(e, n.attrs)),
            (this.defaultAttrs = Er(this.attrs)),
            (this.contentMatch = null),
            (this.inlineContent = null),
            (this.isBlock = !(n.inline || e == 'text')),
            (this.isText = e == 'text');
    }
    get isInline() {
        return !this.isBlock;
    }
    get isTextblock() {
        return this.isBlock && this.inlineContent;
    }
    get isLeaf() {
        return this.contentMatch == Ce.empty;
    }
    get isAtom() {
        return this.isLeaf || !!this.spec.atom;
    }
    isInGroup(e) {
        return this.groups.indexOf(e) > -1;
    }
    get whitespace() {
        return this.spec.whitespace || (this.spec.code ? 'pre' : 'normal');
    }
    hasRequiredAttrs() {
        for (let e in this.attrs) if (this.attrs[e].isRequired) return !0;
        return !1;
    }
    compatibleContent(e) {
        return this == e || this.contentMatch.compatible(e.contentMatch);
    }
    computeAttrs(e) {
        return !e && this.defaultAttrs ? this.defaultAttrs : Ar(this.attrs, e);
    }
    create(e = null, t, n) {
        if (this.isText) throw new Error("NodeType.create can't construct text nodes");
        return new X(this, this.computeAttrs(e), y.from(t), C.setFrom(n));
    }
    createChecked(e = null, t, n) {
        return (t = y.from(t)), this.checkContent(t), new X(this, this.computeAttrs(e), t, C.setFrom(n));
    }
    createAndFill(e = null, t, n) {
        if (((e = this.computeAttrs(e)), (t = y.from(t)), t.size)) {
            let o = this.contentMatch.fillBefore(t);
            if (!o) return null;
            t = o.append(t);
        }
        let i = this.contentMatch.matchFragment(t),
            s = i && i.fillBefore(y.empty, !0);
        return s ? new X(this, e, t.append(s), C.setFrom(n)) : null;
    }
    validContent(e) {
        let t = this.contentMatch.matchFragment(e);
        if (!t || !t.validEnd) return !1;
        for (let n = 0; n < e.childCount; n++) if (!this.allowsMarks(e.child(n).marks)) return !1;
        return !0;
    }
    checkContent(e) {
        if (!this.validContent(e)) throw new RangeError(`Invalid content for node ${this.name}: ${e.toString().slice(0, 50)}`);
    }
    checkAttrs(e) {
        Ir(this.attrs, e, 'node', this.name);
    }
    allowsMarkType(e) {
        return this.markSet == null || this.markSet.indexOf(e) > -1;
    }
    allowsMarks(e) {
        if (this.markSet == null) return !0;
        for (let t = 0; t < e.length; t++) if (!this.allowsMarkType(e[t].type)) return !1;
        return !0;
    }
    allowedMarks(e) {
        if (this.markSet == null) return e;
        let t;
        for (let n = 0; n < e.length; n++) this.allowsMarkType(e[n].type) ? t && t.push(e[n]) : t || (t = e.slice(0, n));
        return t ? (t.length ? t : C.none) : e;
    }
    static compile(e, t) {
        let n = Object.create(null);
        e.forEach((s, o) => (n[s] = new r(s, t, o)));
        let i = t.spec.topNode || 'doc';
        if (!n[i]) throw new RangeError("Schema is missing its top node type ('" + i + "')");
        if (!n.text) throw new RangeError("Every schema needs a 'text' type");
        for (let s in n.text.attrs) throw new RangeError('The text node type should not have attributes');
        return n;
    }
};
function $s(r, e, t) {
    let n = t.split('|');
    return (i) => {
        let s = i === null ? 'null' : typeof i;
        if (n.indexOf(s) < 0) throw new RangeError(`Expected value of type ${n} for attribute ${e} on type ${r}, got ${s}`);
    };
}
var an = class {
        constructor(e, t, n) {
            (this.hasDefault = Object.prototype.hasOwnProperty.call(n, 'default')),
                (this.default = n.default),
                (this.validate = typeof n.validate == 'string' ? $s(e, t, n.validate) : n.validate);
        }
        get isRequired() {
            return !this.hasDefault;
        }
    },
    Ze = class r {
        constructor(e, t, n, i) {
            (this.name = e),
                (this.rank = t),
                (this.schema = n),
                (this.spec = i),
                (this.attrs = Rr(e, i.attrs)),
                (this.excluded = null);
            let s = Er(this.attrs);
            this.instance = s ? new C(this, s) : null;
        }
        create(e = null) {
            return !e && this.instance ? this.instance : new C(this, Ar(this.attrs, e));
        }
        static compile(e, t) {
            let n = Object.create(null),
                i = 0;
            return e.forEach((s, o) => (n[s] = new r(s, i++, t, o))), n;
        }
        removeFromSet(e) {
            for (var t = 0; t < e.length; t++) e[t].type == this && ((e = e.slice(0, t).concat(e.slice(t + 1))), t--);
            return e;
        }
        isInSet(e) {
            for (let t = 0; t < e.length; t++) if (e[t].type == this) return e[t];
        }
        checkAttrs(e) {
            Ir(this.attrs, e, 'mark', this.name);
        }
        excludes(e) {
            return this.excluded.indexOf(e) > -1;
        }
    },
    Tt = class {
        constructor(e) {
            (this.linebreakReplacement = null), (this.cached = Object.create(null));
            let t = (this.spec = {});
            for (let i in e) t[i] = e[i];
            (t.nodes = en.from(e.nodes)),
                (t.marks = en.from(e.marks || {})),
                (this.nodes = Dt.compile(this.spec.nodes, this)),
                (this.marks = Ze.compile(this.spec.marks, this));
            let n = Object.create(null);
            for (let i in this.nodes) {
                if (i in this.marks) throw new RangeError(i + ' can not be both a node and a mark');
                let s = this.nodes[i],
                    o = s.spec.content || '',
                    l = s.spec.marks;
                if (
                    ((s.contentMatch = n[o] || (n[o] = Ce.parse(o, this.nodes))),
                    (s.inlineContent = s.contentMatch.inlineContent),
                    s.spec.linebreakReplacement)
                ) {
                    if (this.linebreakReplacement) throw new RangeError('Multiple linebreak nodes defined');
                    if (!s.isInline || !s.isLeaf) throw new RangeError('Linebreak replacement nodes must be inline leaf nodes');
                    this.linebreakReplacement = s;
                }
                s.markSet = l == '_' ? null : l ? dr(this, l.split(' ')) : l == '' || !s.inlineContent ? [] : null;
            }
            for (let i in this.marks) {
                let s = this.marks[i],
                    o = s.spec.excludes;
                s.excluded = o == null ? [s] : o == '' ? [] : dr(this, o.split(' '));
            }
            (this.nodeFromJSON = this.nodeFromJSON.bind(this)),
                (this.markFromJSON = this.markFromJSON.bind(this)),
                (this.topNodeType = this.nodes[this.spec.topNode || 'doc']),
                (this.cached.wrappings = Object.create(null));
        }
        node(e, t = null, n, i) {
            if (typeof e == 'string') e = this.nodeType(e);
            else if (e instanceof Dt) {
                if (e.schema != this) throw new RangeError('Node type from different schema used (' + e.name + ')');
            } else throw new RangeError('Invalid node type: ' + e);
            return e.createChecked(t, n, i);
        }
        text(e, t) {
            let n = this.nodes.text;
            return new on(n, n.defaultAttrs, e, C.setFrom(t));
        }
        mark(e, t) {
            return typeof e == 'string' && (e = this.marks[e]), e.create(t);
        }
        nodeFromJSON(e) {
            return X.fromJSON(this, e);
        }
        markFromJSON(e) {
            return C.fromJSON(this, e);
        }
        nodeType(e) {
            let t = this.nodes[e];
            if (!t) throw new RangeError('Unknown node type: ' + e);
            return t;
        }
    };
function dr(r, e) {
    let t = [];
    for (let n = 0; n < e.length; n++) {
        let i = e[n],
            s = r.marks[i],
            o = s;
        if (s) t.push(s);
        else
            for (let l in r.marks) {
                let a = r.marks[l];
                (i == '_' || (a.spec.group && a.spec.group.split(' ').indexOf(i) > -1)) && t.push((o = a));
            }
        if (!o) throw new SyntaxError("Unknown mark type: '" + e[n] + "'");
    }
    return t;
}
function qs(r) {
    return r.tag != null;
}
function Ks(r) {
    return r.style != null;
}
var Qe = class r {
        constructor(e, t) {
            (this.schema = e), (this.rules = t), (this.tags = []), (this.styles = []);
            let n = (this.matchedStyles = []);
            t.forEach((i) => {
                if (qs(i)) this.tags.push(i);
                else if (Ks(i)) {
                    let s = /[^=]*/.exec(i.style)[0];
                    n.indexOf(s) < 0 && n.push(s), this.styles.push(i);
                }
            }),
                (this.normalizeLists = !this.tags.some((i) => {
                    if (!/^(ul|ol)\b/.test(i.tag) || !i.node) return !1;
                    let s = e.nodes[i.node];
                    return s.contentMatch.matchType(s);
                }));
        }
        parse(e, t = {}) {
            let n = new Et(this, t, !1);
            return n.addAll(e, C.none, t.from, t.to), n.finish();
        }
        parseSlice(e, t = {}) {
            let n = new Et(this, t, !0);
            return n.addAll(e, C.none, t.from, t.to), x.maxOpen(n.finish());
        }
        matchTag(e, t, n) {
            for (let i = n ? this.tags.indexOf(n) + 1 : 0; i < this.tags.length; i++) {
                let s = this.tags[i];
                if (
                    Us(e, s.tag) &&
                    (s.namespace === void 0 || e.namespaceURI == s.namespace) &&
                    (!s.context || t.matchesContext(s.context))
                ) {
                    if (s.getAttrs) {
                        let o = s.getAttrs(e);
                        if (o === !1) continue;
                        s.attrs = o || void 0;
                    }
                    return s;
                }
            }
        }
        matchStyle(e, t, n, i) {
            for (let s = i ? this.styles.indexOf(i) + 1 : 0; s < this.styles.length; s++) {
                let o = this.styles[s],
                    l = o.style;
                if (
                    !(
                        l.indexOf(e) != 0 ||
                        (o.context && !n.matchesContext(o.context)) ||
                        (l.length > e.length && (l.charCodeAt(e.length) != 61 || l.slice(e.length + 1) != t))
                    )
                ) {
                    if (o.getAttrs) {
                        let a = o.getAttrs(t);
                        if (a === !1) continue;
                        o.attrs = a || void 0;
                    }
                    return o;
                }
            }
        }
        static schemaRules(e) {
            let t = [];
            function n(i) {
                let s = i.priority == null ? 50 : i.priority,
                    o = 0;
                for (; o < t.length; o++) {
                    let l = t[o];
                    if ((l.priority == null ? 50 : l.priority) < s) break;
                }
                t.splice(o, 0, i);
            }
            for (let i in e.marks) {
                let s = e.marks[i].spec.parseDOM;
                s &&
                    s.forEach((o) => {
                        n((o = mr(o))), o.mark || o.ignore || o.clearMark || (o.mark = i);
                    });
            }
            for (let i in e.nodes) {
                let s = e.nodes[i].spec.parseDOM;
                s &&
                    s.forEach((o) => {
                        n((o = mr(o))), o.node || o.ignore || o.mark || (o.node = i);
                    });
            }
            return t;
        }
        static fromSchema(e) {
            return e.cached.domParser || (e.cached.domParser = new r(e, r.schemaRules(e)));
        }
    },
    zr = {
        address: !0,
        article: !0,
        aside: !0,
        blockquote: !0,
        canvas: !0,
        dd: !0,
        div: !0,
        dl: !0,
        fieldset: !0,
        figcaption: !0,
        figure: !0,
        footer: !0,
        form: !0,
        h1: !0,
        h2: !0,
        h3: !0,
        h4: !0,
        h5: !0,
        h6: !0,
        header: !0,
        hgroup: !0,
        hr: !0,
        li: !0,
        noscript: !0,
        ol: !0,
        output: !0,
        p: !0,
        pre: !0,
        section: !0,
        table: !0,
        tfoot: !0,
        ul: !0,
    },
    Hs = { head: !0, noscript: !0, object: !0, script: !0, style: !0, title: !0 },
    Pr = { ol: !0, ul: !0 },
    _e = 1,
    fn = 2,
    Xe = 4;
function pr(r, e, t) {
    return e != null ? (e ? _e : 0) | (e === 'full' ? fn : 0) : r && r.whitespace == 'pre' ? _e | fn : t & ~Xe;
}
var ve = class {
        constructor(e, t, n, i, s, o) {
            (this.type = e),
                (this.attrs = t),
                (this.marks = n),
                (this.solid = i),
                (this.options = o),
                (this.content = []),
                (this.activeMarks = C.none),
                (this.match = s || (o & Xe ? null : e.contentMatch));
        }
        findWrapping(e) {
            if (!this.match) {
                if (!this.type) return [];
                let t = this.type.contentMatch.fillBefore(y.from(e));
                if (t) this.match = this.type.contentMatch.matchFragment(t);
                else {
                    let n = this.type.contentMatch,
                        i;
                    return (i = n.findWrapping(e.type)) ? ((this.match = n), i) : null;
                }
            }
            return this.match.findWrapping(e.type);
        }
        finish(e) {
            if (!(this.options & _e)) {
                let n = this.content[this.content.length - 1],
                    i;
                if (n && n.isText && (i = /[ \t\r\n\u000c]+$/.exec(n.text))) {
                    let s = n;
                    n.text.length == i[0].length
                        ? this.content.pop()
                        : (this.content[this.content.length - 1] = s.withText(s.text.slice(0, s.text.length - i[0].length)));
                }
            }
            let t = y.from(this.content);
            return (
                !e && this.match && (t = t.append(this.match.fillBefore(y.empty, !0))),
                this.type ? this.type.create(this.attrs, t, this.marks) : t
            );
        }
        inlineContext(e) {
            return this.type
                ? this.type.inlineContent
                : this.content.length
                  ? this.content[0].isInline
                  : e.parentNode && !zr.hasOwnProperty(e.parentNode.nodeName.toLowerCase());
        }
    },
    Et = class {
        constructor(e, t, n) {
            (this.parser = e), (this.options = t), (this.isOpen = n), (this.open = 0), (this.localPreserveWS = !1);
            let i = t.topNode,
                s,
                o = pr(null, t.preserveWhitespace, 0) | (n ? Xe : 0);
            i
                ? (s = new ve(i.type, i.attrs, C.none, !0, t.topMatch || i.type.contentMatch, o))
                : n
                  ? (s = new ve(null, null, C.none, !0, null, o))
                  : (s = new ve(e.schema.topNodeType, null, C.none, !0, null, o)),
                (this.nodes = [s]),
                (this.find = t.findPositions),
                (this.needsBlock = !1);
        }
        get top() {
            return this.nodes[this.open];
        }
        addDOM(e, t) {
            e.nodeType == 3 ? this.addTextNode(e, t) : e.nodeType == 1 && this.addElement(e, t);
        }
        addTextNode(e, t) {
            let n = e.nodeValue,
                i = this.top,
                s = i.options & fn ? 'full' : this.localPreserveWS || (i.options & _e) > 0;
            if (s === 'full' || i.inlineContext(e) || /[^ \t\r\n\u000c]/.test(n)) {
                if (s)
                    s !== 'full'
                        ? (n = n.replace(/\r?\n|\r/g, ' '))
                        : (n = n.replace(
                              /\r\n?/g,
                              `
`,
                          ));
                else if (
                    ((n = n.replace(/[ \t\r\n\u000c]+/g, ' ')),
                    /^[ \t\r\n\u000c]/.test(n) && this.open == this.nodes.length - 1)
                ) {
                    let o = i.content[i.content.length - 1],
                        l = e.previousSibling;
                    (!o || (l && l.nodeName == 'BR') || (o.isText && /[ \t\r\n\u000c]$/.test(o.text))) && (n = n.slice(1));
                }
                n && this.insertNode(this.parser.schema.text(n), t), this.findInText(e);
            } else this.findInside(e);
        }
        addElement(e, t, n) {
            let i = this.localPreserveWS,
                s = this.top;
            (e.tagName == 'PRE' || /pre/.test(e.style && e.style.whiteSpace)) && (this.localPreserveWS = !0);
            let o = e.nodeName.toLowerCase(),
                l;
            Pr.hasOwnProperty(o) && this.parser.normalizeLists && js(e);
            let a = (this.options.ruleFromNode && this.options.ruleFromNode(e)) || (l = this.parser.matchTag(e, this, n));
            e: if (a ? a.ignore : Hs.hasOwnProperty(o)) this.findInside(e), this.ignoreFallback(e, t);
            else if (!a || a.skip || a.closeParent) {
                a && a.closeParent ? (this.open = Math.max(0, this.open - 1)) : a && a.skip.nodeType && (e = a.skip);
                let f,
                    c = this.needsBlock;
                if (zr.hasOwnProperty(o))
                    s.content.length && s.content[0].isInline && this.open && (this.open--, (s = this.top)),
                        (f = !0),
                        s.type || (this.needsBlock = !0);
                else if (!e.firstChild) {
                    this.leafFallback(e, t);
                    break e;
                }
                let h = a && a.skip ? t : this.readStyles(e, t);
                h && this.addAll(e, h), f && this.sync(s), (this.needsBlock = c);
            } else {
                let f = this.readStyles(e, t);
                f && this.addElementByRule(e, a, f, a.consuming === !1 ? l : void 0);
            }
            this.localPreserveWS = i;
        }
        leafFallback(e, t) {
            e.nodeName == 'BR' &&
                this.top.type &&
                this.top.type.inlineContent &&
                this.addTextNode(
                    e.ownerDocument.createTextNode(`
`),
                    t,
                );
        }
        ignoreFallback(e, t) {
            e.nodeName == 'BR' &&
                (!this.top.type || !this.top.type.inlineContent) &&
                this.findPlace(this.parser.schema.text('-'), t);
        }
        readStyles(e, t) {
            let n = e.style;
            if (n && n.length)
                for (let i = 0; i < this.parser.matchedStyles.length; i++) {
                    let s = this.parser.matchedStyles[i],
                        o = n.getPropertyValue(s);
                    if (o)
                        for (let l = void 0; ; ) {
                            let a = this.parser.matchStyle(s, o, this, l);
                            if (!a) break;
                            if (a.ignore) return null;
                            if (
                                (a.clearMark
                                    ? (t = t.filter((f) => !a.clearMark(f)))
                                    : (t = t.concat(this.parser.schema.marks[a.mark].create(a.attrs))),
                                a.consuming === !1)
                            )
                                l = a;
                            else break;
                        }
                }
            return t;
        }
        addElementByRule(e, t, n, i) {
            let s, o;
            if (t.node)
                if (((o = this.parser.schema.nodes[t.node]), o.isLeaf))
                    this.insertNode(o.create(t.attrs), n) || this.leafFallback(e, n);
                else {
                    let a = this.enter(o, t.attrs || null, n, t.preserveWhitespace);
                    a && ((s = !0), (n = a));
                }
            else {
                let a = this.parser.schema.marks[t.mark];
                n = n.concat(a.create(t.attrs));
            }
            let l = this.top;
            if (o && o.isLeaf) this.findInside(e);
            else if (i) this.addElement(e, n, i);
            else if (t.getContent)
                this.findInside(e), t.getContent(e, this.parser.schema).forEach((a) => this.insertNode(a, n));
            else {
                let a = e;
                typeof t.contentElement == 'string'
                    ? (a = e.querySelector(t.contentElement))
                    : typeof t.contentElement == 'function'
                      ? (a = t.contentElement(e))
                      : t.contentElement && (a = t.contentElement),
                    this.findAround(e, a, !0),
                    this.addAll(a, n),
                    this.findAround(e, a, !1);
            }
            s && this.sync(l) && this.open--;
        }
        addAll(e, t, n, i) {
            let s = n || 0;
            for (
                let o = n ? e.childNodes[n] : e.firstChild, l = i == null ? null : e.childNodes[i];
                o != l;
                o = o.nextSibling, ++s
            )
                this.findAtPoint(e, s), this.addDOM(o, t);
            this.findAtPoint(e, s);
        }
        findPlace(e, t) {
            let n, i;
            for (let s = this.open; s >= 0; s--) {
                let o = this.nodes[s],
                    l = o.findWrapping(e);
                if ((l && (!n || n.length > l.length) && ((n = l), (i = o), !l.length)) || o.solid) break;
            }
            if (!n) return null;
            this.sync(i);
            for (let s = 0; s < n.length; s++) t = this.enterInner(n[s], null, t, !1);
            return t;
        }
        insertNode(e, t) {
            if (e.isInline && this.needsBlock && !this.top.type) {
                let i = this.textblockFromContext();
                i && (t = this.enterInner(i, null, t));
            }
            let n = this.findPlace(e, t);
            if (n) {
                this.closeExtra();
                let i = this.top;
                i.match && (i.match = i.match.matchType(e.type));
                let s = C.none;
                for (let o of n.concat(e.marks))
                    (i.type ? i.type.allowsMarkType(o.type) : gr(o.type, e.type)) && (s = o.addToSet(s));
                return i.content.push(e.mark(s)), !0;
            }
            return !1;
        }
        enter(e, t, n, i) {
            let s = this.findPlace(e.create(t), n);
            return s && (s = this.enterInner(e, t, n, !0, i)), s;
        }
        enterInner(e, t, n, i = !1, s) {
            this.closeExtra();
            let o = this.top;
            o.match = o.match && o.match.matchType(e);
            let l = pr(e, s, o.options);
            o.options & Xe && o.content.length == 0 && (l |= Xe);
            let a = C.none;
            return (
                (n = n.filter((f) =>
                    (o.type ? o.type.allowsMarkType(f.type) : gr(f.type, e)) ? ((a = f.addToSet(a)), !1) : !0,
                )),
                this.nodes.push(new ve(e, t, a, i, null, l)),
                this.open++,
                n
            );
        }
        closeExtra(e = !1) {
            let t = this.nodes.length - 1;
            if (t > this.open) {
                for (; t > this.open; t--) this.nodes[t - 1].content.push(this.nodes[t].finish(e));
                this.nodes.length = this.open + 1;
            }
        }
        finish() {
            return (this.open = 0), this.closeExtra(this.isOpen), this.nodes[0].finish(!!(this.isOpen || this.options.topOpen));
        }
        sync(e) {
            for (let t = this.open; t >= 0; t--) {
                if (this.nodes[t] == e) return (this.open = t), !0;
                this.localPreserveWS && (this.nodes[t].options |= _e);
            }
            return !1;
        }
        get currentPos() {
            this.closeExtra();
            let e = 0;
            for (let t = this.open; t >= 0; t--) {
                let n = this.nodes[t].content;
                for (let i = n.length - 1; i >= 0; i--) e += n[i].nodeSize;
                t && e++;
            }
            return e;
        }
        findAtPoint(e, t) {
            if (this.find)
                for (let n = 0; n < this.find.length; n++)
                    this.find[n].node == e && this.find[n].offset == t && (this.find[n].pos = this.currentPos);
        }
        findInside(e) {
            if (this.find)
                for (let t = 0; t < this.find.length; t++)
                    this.find[t].pos == null &&
                        e.nodeType == 1 &&
                        e.contains(this.find[t].node) &&
                        (this.find[t].pos = this.currentPos);
        }
        findAround(e, t, n) {
            if (e != t && this.find)
                for (let i = 0; i < this.find.length; i++)
                    this.find[i].pos == null &&
                        e.nodeType == 1 &&
                        e.contains(this.find[i].node) &&
                        t.compareDocumentPosition(this.find[i].node) & (n ? 2 : 4) &&
                        (this.find[i].pos = this.currentPos);
        }
        findInText(e) {
            if (this.find)
                for (let t = 0; t < this.find.length; t++)
                    this.find[t].node == e && (this.find[t].pos = this.currentPos - (e.nodeValue.length - this.find[t].offset));
        }
        matchesContext(e) {
            if (e.indexOf('|') > -1) return e.split(/\s*\|\s*/).some(this.matchesContext, this);
            let t = e.split('/'),
                n = this.options.context,
                i = !this.isOpen && (!n || n.parent.type == this.nodes[0].type),
                s = -(n ? n.depth + 1 : 0) + (i ? 0 : 1),
                o = (l, a) => {
                    for (; l >= 0; l--) {
                        let f = t[l];
                        if (f == '') {
                            if (l == t.length - 1 || l == 0) continue;
                            for (; a >= s; a--) if (o(l - 1, a)) return !0;
                            return !1;
                        } else {
                            let c = a > 0 || (a == 0 && i) ? this.nodes[a].type : n && a >= s ? n.node(a - s).type : null;
                            if (!c || (c.name != f && !c.isInGroup(f))) return !1;
                            a--;
                        }
                    }
                    return !0;
                };
            return o(t.length - 1, this.open);
        }
        textblockFromContext() {
            let e = this.options.context;
            if (e)
                for (let t = e.depth; t >= 0; t--) {
                    let n = e.node(t).contentMatchAt(e.indexAfter(t)).defaultType;
                    if (n && n.isTextblock && n.defaultAttrs) return n;
                }
            for (let t in this.parser.schema.nodes) {
                let n = this.parser.schema.nodes[t];
                if (n.isTextblock && n.defaultAttrs) return n;
            }
        }
    };
function js(r) {
    for (let e = r.firstChild, t = null; e; e = e.nextSibling) {
        let n = e.nodeType == 1 ? e.nodeName.toLowerCase() : null;
        n && Pr.hasOwnProperty(n) && t ? (t.appendChild(e), (e = t)) : n == 'li' ? (t = e) : n && (t = null);
    }
}
function Us(r, e) {
    return (r.matches || r.msMatchesSelector || r.webkitMatchesSelector || r.mozMatchesSelector).call(r, e);
}
function mr(r) {
    let e = {};
    for (let t in r) e[t] = r[t];
    return e;
}
function gr(r, e) {
    let t = e.schema.nodes;
    for (let n in t) {
        let i = t[n];
        if (!i.allowsMarkType(r)) continue;
        let s = [],
            o = (l) => {
                s.push(l);
                for (let a = 0; a < l.edgeCount; a++) {
                    let { type: f, next: c } = l.edge(a);
                    if (f == e || (s.indexOf(c) < 0 && o(c))) return !0;
                }
            };
        if (o(i.contentMatch)) return !0;
    }
}
var Oe = class r {
    constructor(e, t) {
        (this.nodes = e), (this.marks = t);
    }
    serializeFragment(e, t = {}, n) {
        n || (n = nn(t).createDocumentFragment());
        let i = n,
            s = [];
        return (
            e.forEach((o) => {
                if (s.length || o.marks.length) {
                    let l = 0,
                        a = 0;
                    for (; l < s.length && a < o.marks.length; ) {
                        let f = o.marks[a];
                        if (!this.marks[f.type.name]) {
                            a++;
                            continue;
                        }
                        if (!f.eq(s[l][0]) || f.type.spec.spanning === !1) break;
                        l++, a++;
                    }
                    for (; l < s.length; ) i = s.pop()[1];
                    for (; a < o.marks.length; ) {
                        let f = o.marks[a++],
                            c = this.serializeMark(f, o.isInline, t);
                        c && (s.push([f, i]), i.appendChild(c.dom), (i = c.contentDOM || c.dom));
                    }
                }
                i.appendChild(this.serializeNodeInner(o, t));
            }),
            n
        );
    }
    serializeNodeInner(e, t) {
        let { dom: n, contentDOM: i } = Ct(nn(t), this.nodes[e.type.name](e), null, e.attrs);
        if (i) {
            if (e.isLeaf) throw new RangeError('Content hole not allowed in a leaf node spec');
            this.serializeFragment(e.content, t, i);
        }
        return n;
    }
    serializeNode(e, t = {}) {
        let n = this.serializeNodeInner(e, t);
        for (let i = e.marks.length - 1; i >= 0; i--) {
            let s = this.serializeMark(e.marks[i], e.isInline, t);
            s && ((s.contentDOM || s.dom).appendChild(n), (n = s.dom));
        }
        return n;
    }
    serializeMark(e, t, n = {}) {
        let i = this.marks[e.type.name];
        return i && Ct(nn(n), i(e, t), null, e.attrs);
    }
    static renderSpec(e, t, n = null, i) {
        return Ct(e, t, n, i);
    }
    static fromSchema(e) {
        return e.cached.domSerializer || (e.cached.domSerializer = new r(this.nodesFromSchema(e), this.marksFromSchema(e)));
    }
    static nodesFromSchema(e) {
        let t = yr(e.nodes);
        return t.text || (t.text = (n) => n.text), t;
    }
    static marksFromSchema(e) {
        return yr(e.marks);
    }
};
function yr(r) {
    let e = {};
    for (let t in r) {
        let n = r[t].spec.toDOM;
        n && (e[t] = n);
    }
    return e;
}
function nn(r) {
    return r.document || window.document;
}
var xr = new WeakMap();
function Gs(r) {
    let e = xr.get(r);
    return e === void 0 && xr.set(r, (e = Ys(r))), e;
}
function Ys(r) {
    let e = null;
    function t(n) {
        if (n && typeof n == 'object')
            if (Array.isArray(n))
                if (typeof n[0] == 'string') e || (e = []), e.push(n);
                else for (let i = 0; i < n.length; i++) t(n[i]);
            else for (let i in n) t(n[i]);
    }
    return t(r), e;
}
function Ct(r, e, t, n) {
    if (typeof e == 'string') return { dom: r.createTextNode(e) };
    if (e.nodeType != null) return { dom: e };
    if (e.dom && e.dom.nodeType != null) return e;
    let i = e[0],
        s;
    if (typeof i != 'string') throw new RangeError('Invalid array passed to renderSpec');
    if (n && (s = Gs(n)) && s.indexOf(e) > -1)
        throw new RangeError(
            'Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.',
        );
    let o = i.indexOf(' ');
    o > 0 && ((t = i.slice(0, o)), (i = i.slice(o + 1)));
    let l,
        a = t ? r.createElementNS(t, i) : r.createElement(i),
        f = e[1],
        c = 1;
    if (f && typeof f == 'object' && f.nodeType == null && !Array.isArray(f)) {
        c = 2;
        for (let h in f)
            if (f[h] != null) {
                let u = h.indexOf(' ');
                u > 0 ? a.setAttributeNS(h.slice(0, u), h.slice(u + 1), f[h]) : a.setAttribute(h, f[h]);
            }
    }
    for (let h = c; h < e.length; h++) {
        let u = e[h];
        if (u === 0) {
            if (h < e.length - 1 || h > c) throw new RangeError('Content hole must be the only child of its parent node');
            return { dom: a, contentDOM: a };
        } else {
            let { dom: p, contentDOM: d } = Ct(r, u, t, n);
            if ((a.appendChild(p), d)) {
                if (l) throw new RangeError('Multiple content holes');
                l = d;
            }
        }
    }
    return { dom: a, contentDOM: l };
}
var vr = 65535,
    Vr = Math.pow(2, 16);
function Xs(r, e) {
    return r + e * Vr;
}
function Br(r) {
    return r & vr;
}
function Zs(r) {
    return (r - (r & vr)) / Vr;
}
var Lr = 1,
    Jr = 2,
    At = 4,
    Wr = 8,
    nt = class {
        constructor(e, t, n) {
            (this.pos = e), (this.delInfo = t), (this.recover = n);
        }
        get deleted() {
            return (this.delInfo & Wr) > 0;
        }
        get deletedBefore() {
            return (this.delInfo & (Lr | At)) > 0;
        }
        get deletedAfter() {
            return (this.delInfo & (Jr | At)) > 0;
        }
        get deletedAcross() {
            return (this.delInfo & At) > 0;
        }
    },
    te = class r {
        constructor(e, t = !1) {
            if (((this.ranges = e), (this.inverted = t), !e.length && r.empty)) return r.empty;
        }
        recover(e) {
            let t = 0,
                n = Br(e);
            if (!this.inverted) for (let i = 0; i < n; i++) t += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
            return this.ranges[n * 3] + t + Zs(e);
        }
        mapResult(e, t = 1) {
            return this._map(e, t, !1);
        }
        map(e, t = 1) {
            return this._map(e, t, !0);
        }
        _map(e, t, n) {
            let i = 0,
                s = this.inverted ? 2 : 1,
                o = this.inverted ? 1 : 2;
            for (let l = 0; l < this.ranges.length; l += 3) {
                let a = this.ranges[l] - (this.inverted ? i : 0);
                if (a > e) break;
                let f = this.ranges[l + s],
                    c = this.ranges[l + o],
                    h = a + f;
                if (e <= h) {
                    let u = f ? (e == a ? -1 : e == h ? 1 : t) : t,
                        p = a + i + (u < 0 ? 0 : c);
                    if (n) return p;
                    let d = e == (t < 0 ? a : h) ? null : Xs(l / 3, e - a),
                        m = e == a ? Jr : e == h ? Lr : At;
                    return (t < 0 ? e != a : e != h) && (m |= Wr), new nt(p, m, d);
                }
                i += c - f;
            }
            return n ? e + i : new nt(e + i, 0, null);
        }
        touches(e, t) {
            let n = 0,
                i = Br(t),
                s = this.inverted ? 2 : 1,
                o = this.inverted ? 1 : 2;
            for (let l = 0; l < this.ranges.length; l += 3) {
                let a = this.ranges[l] - (this.inverted ? n : 0);
                if (a > e) break;
                let f = this.ranges[l + s],
                    c = a + f;
                if (e <= c && l == i * 3) return !0;
                n += this.ranges[l + o] - f;
            }
            return !1;
        }
        forEach(e) {
            let t = this.inverted ? 2 : 1,
                n = this.inverted ? 1 : 2;
            for (let i = 0, s = 0; i < this.ranges.length; i += 3) {
                let o = this.ranges[i],
                    l = o - (this.inverted ? s : 0),
                    a = o + (this.inverted ? 0 : s),
                    f = this.ranges[i + t],
                    c = this.ranges[i + n];
                e(l, l + f, a, a + c), (s += c - f);
            }
        }
        invert() {
            return new r(this.ranges, !this.inverted);
        }
        toString() {
            return (this.inverted ? '-' : '') + JSON.stringify(this.ranges);
        }
        static offset(e) {
            return e == 0 ? r.empty : new r(e < 0 ? [0, -e, 0] : [0, 0, e]);
        }
    };
te.empty = new te([]);
var rt = class r {
        constructor(e = [], t, n = 0, i = e.length) {
            (this.maps = e), (this.mirror = t), (this.from = n), (this.to = i);
        }
        slice(e = 0, t = this.maps.length) {
            return new r(this.maps, this.mirror, e, t);
        }
        copy() {
            return new r(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to);
        }
        appendMap(e, t) {
            (this.to = this.maps.push(e)), t != null && this.setMirror(this.maps.length - 1, t);
        }
        appendMapping(e) {
            for (let t = 0, n = this.maps.length; t < e.maps.length; t++) {
                let i = e.getMirror(t);
                this.appendMap(e.maps[t], i != null && i < t ? n + i : void 0);
            }
        }
        getMirror(e) {
            if (this.mirror) {
                for (let t = 0; t < this.mirror.length; t++) if (this.mirror[t] == e) return this.mirror[t + (t % 2 ? -1 : 1)];
            }
        }
        setMirror(e, t) {
            this.mirror || (this.mirror = []), this.mirror.push(e, t);
        }
        appendMappingInverted(e) {
            for (let t = e.maps.length - 1, n = this.maps.length + e.maps.length; t >= 0; t--) {
                let i = e.getMirror(t);
                this.appendMap(e.maps[t].invert(), i != null && i > t ? n - i - 1 : void 0);
            }
        }
        invert() {
            let e = new r();
            return e.appendMappingInverted(this), e;
        }
        map(e, t = 1) {
            if (this.mirror) return this._map(e, t, !0);
            for (let n = this.from; n < this.to; n++) e = this.maps[n].map(e, t);
            return e;
        }
        mapResult(e, t = 1) {
            return this._map(e, t, !1);
        }
        _map(e, t, n) {
            let i = 0;
            for (let s = this.from; s < this.to; s++) {
                let o = this.maps[s],
                    l = o.mapResult(e, t);
                if (l.recover != null) {
                    let a = this.getMirror(s);
                    if (a != null && a > s && a < this.to) {
                        (s = a), (e = this.maps[a].recover(l.recover));
                        continue;
                    }
                }
                (i |= l.delInfo), (e = l.pos);
            }
            return n ? e : new nt(e, i, null);
        }
    },
    cn = Object.create(null),
    D = class {
        getMap() {
            return te.empty;
        }
        merge(e) {
            return null;
        }
        static fromJSON(e, t) {
            if (!t || !t.stepType) throw new RangeError('Invalid input for Step.fromJSON');
            let n = cn[t.stepType];
            if (!n) throw new RangeError(`No step type ${t.stepType} defined`);
            return n.fromJSON(e, t);
        }
        static jsonID(e, t) {
            if (e in cn) throw new RangeError('Duplicate use of step JSON ID ' + e);
            return (cn[e] = t), (t.prototype.jsonID = e), t;
        }
    },
    E = class r {
        constructor(e, t) {
            (this.doc = e), (this.failed = t);
        }
        static ok(e) {
            return new r(e, null);
        }
        static fail(e) {
            return new r(null, e);
        }
        static fromReplace(e, t, n, i) {
            try {
                return r.ok(e.replace(t, n, i));
            } catch (s) {
                if (s instanceof ke) return r.fail(s.message);
                throw s;
            }
        }
    };
function mn(r, e, t) {
    let n = [];
    for (let i = 0; i < r.childCount; i++) {
        let s = r.child(i);
        s.content.size && (s = s.copy(mn(s.content, e, s))), s.isInline && (s = e(s, t, i)), n.push(s);
    }
    return y.fromArray(n);
}
var it = class r extends D {
    constructor(e, t, n) {
        super(), (this.from = e), (this.to = t), (this.mark = n);
    }
    apply(e) {
        let t = e.slice(this.from, this.to),
            n = e.resolve(this.from),
            i = n.node(n.sharedDepth(this.to)),
            s = new x(
                mn(
                    t.content,
                    (o, l) => (!o.isAtom || !l.type.allowsMarkType(this.mark.type) ? o : o.mark(this.mark.addToSet(o.marks))),
                    i,
                ),
                t.openStart,
                t.openEnd,
            );
        return E.fromReplace(e, this.from, this.to, s);
    }
    invert() {
        return new Ne(this.from, this.to, this.mark);
    }
    map(e) {
        let t = e.mapResult(this.from, 1),
            n = e.mapResult(this.to, -1);
        return (t.deleted && n.deleted) || t.pos >= n.pos ? null : new r(t.pos, n.pos, this.mark);
    }
    merge(e) {
        return e instanceof r && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from
            ? new r(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark)
            : null;
    }
    toJSON() {
        return { stepType: 'addMark', mark: this.mark.toJSON(), from: this.from, to: this.to };
    }
    static fromJSON(e, t) {
        if (typeof t.from != 'number' || typeof t.to != 'number')
            throw new RangeError('Invalid input for AddMarkStep.fromJSON');
        return new r(t.from, t.to, e.markFromJSON(t.mark));
    }
};
D.jsonID('addMark', it);
var Ne = class r extends D {
    constructor(e, t, n) {
        super(), (this.from = e), (this.to = t), (this.mark = n);
    }
    apply(e) {
        let t = e.slice(this.from, this.to),
            n = new x(
                mn(t.content, (i) => i.mark(this.mark.removeFromSet(i.marks)), e),
                t.openStart,
                t.openEnd,
            );
        return E.fromReplace(e, this.from, this.to, n);
    }
    invert() {
        return new it(this.from, this.to, this.mark);
    }
    map(e) {
        let t = e.mapResult(this.from, 1),
            n = e.mapResult(this.to, -1);
        return (t.deleted && n.deleted) || t.pos >= n.pos ? null : new r(t.pos, n.pos, this.mark);
    }
    merge(e) {
        return e instanceof r && e.mark.eq(this.mark) && this.from <= e.to && this.to >= e.from
            ? new r(Math.min(this.from, e.from), Math.max(this.to, e.to), this.mark)
            : null;
    }
    toJSON() {
        return { stepType: 'removeMark', mark: this.mark.toJSON(), from: this.from, to: this.to };
    }
    static fromJSON(e, t) {
        if (typeof t.from != 'number' || typeof t.to != 'number')
            throw new RangeError('Invalid input for RemoveMarkStep.fromJSON');
        return new r(t.from, t.to, e.markFromJSON(t.mark));
    }
};
D.jsonID('removeMark', Ne);
var st = class r extends D {
    constructor(e, t) {
        super(), (this.pos = e), (this.mark = t);
    }
    apply(e) {
        let t = e.nodeAt(this.pos);
        if (!t) return E.fail("No node at mark step's position");
        let n = t.type.create(t.attrs, null, this.mark.addToSet(t.marks));
        return E.fromReplace(e, this.pos, this.pos + 1, new x(y.from(n), 0, t.isLeaf ? 0 : 1));
    }
    invert(e) {
        let t = e.nodeAt(this.pos);
        if (t) {
            let n = this.mark.addToSet(t.marks);
            if (n.length == t.marks.length) {
                for (let i = 0; i < t.marks.length; i++) if (!t.marks[i].isInSet(n)) return new r(this.pos, t.marks[i]);
                return new r(this.pos, this.mark);
            }
        }
        return new ot(this.pos, this.mark);
    }
    map(e) {
        let t = e.mapResult(this.pos, 1);
        return t.deletedAfter ? null : new r(t.pos, this.mark);
    }
    toJSON() {
        return { stepType: 'addNodeMark', pos: this.pos, mark: this.mark.toJSON() };
    }
    static fromJSON(e, t) {
        if (typeof t.pos != 'number') throw new RangeError('Invalid input for AddNodeMarkStep.fromJSON');
        return new r(t.pos, e.markFromJSON(t.mark));
    }
};
D.jsonID('addNodeMark', st);
var ot = class r extends D {
    constructor(e, t) {
        super(), (this.pos = e), (this.mark = t);
    }
    apply(e) {
        let t = e.nodeAt(this.pos);
        if (!t) return E.fail("No node at mark step's position");
        let n = t.type.create(t.attrs, null, this.mark.removeFromSet(t.marks));
        return E.fromReplace(e, this.pos, this.pos + 1, new x(y.from(n), 0, t.isLeaf ? 0 : 1));
    }
    invert(e) {
        let t = e.nodeAt(this.pos);
        return !t || !this.mark.isInSet(t.marks) ? this : new st(this.pos, this.mark);
    }
    map(e) {
        let t = e.mapResult(this.pos, 1);
        return t.deletedAfter ? null : new r(t.pos, this.mark);
    }
    toJSON() {
        return { stepType: 'removeNodeMark', pos: this.pos, mark: this.mark.toJSON() };
    }
    static fromJSON(e, t) {
        if (typeof t.pos != 'number') throw new RangeError('Invalid input for RemoveNodeMarkStep.fromJSON');
        return new r(t.pos, e.markFromJSON(t.mark));
    }
};
D.jsonID('removeNodeMark', ot);
var L = class r extends D {
    constructor(e, t, n, i = !1) {
        super(), (this.from = e), (this.to = t), (this.slice = n), (this.structure = i);
    }
    apply(e) {
        return this.structure && dn(e, this.from, this.to)
            ? E.fail('Structure replace would overwrite content')
            : E.fromReplace(e, this.from, this.to, this.slice);
    }
    getMap() {
        return new te([this.from, this.to - this.from, this.slice.size]);
    }
    invert(e) {
        return new r(this.from, this.from + this.slice.size, e.slice(this.from, this.to));
    }
    map(e) {
        let t = e.mapResult(this.from, 1),
            n = e.mapResult(this.to, -1);
        return t.deletedAcross && n.deletedAcross ? null : new r(t.pos, Math.max(t.pos, n.pos), this.slice);
    }
    merge(e) {
        if (!(e instanceof r) || e.structure || this.structure) return null;
        if (this.from + this.slice.size == e.from && !this.slice.openEnd && !e.slice.openStart) {
            let t =
                this.slice.size + e.slice.size == 0
                    ? x.empty
                    : new x(this.slice.content.append(e.slice.content), this.slice.openStart, e.slice.openEnd);
            return new r(this.from, this.to + (e.to - e.from), t, this.structure);
        } else if (e.to == this.from && !this.slice.openStart && !e.slice.openEnd) {
            let t =
                this.slice.size + e.slice.size == 0
                    ? x.empty
                    : new x(e.slice.content.append(this.slice.content), e.slice.openStart, this.slice.openEnd);
            return new r(e.from, this.to, t, this.structure);
        } else return null;
    }
    toJSON() {
        let e = { stepType: 'replace', from: this.from, to: this.to };
        return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
    }
    static fromJSON(e, t) {
        if (typeof t.from != 'number' || typeof t.to != 'number')
            throw new RangeError('Invalid input for ReplaceStep.fromJSON');
        return new r(t.from, t.to, x.fromJSON(e, t.slice), !!t.structure);
    }
};
D.jsonID('replace', L);
var T = class r extends D {
    constructor(e, t, n, i, s, o, l = !1) {
        super(),
            (this.from = e),
            (this.to = t),
            (this.gapFrom = n),
            (this.gapTo = i),
            (this.slice = s),
            (this.insert = o),
            (this.structure = l);
    }
    apply(e) {
        if (this.structure && (dn(e, this.from, this.gapFrom) || dn(e, this.gapTo, this.to)))
            return E.fail('Structure gap-replace would overwrite content');
        let t = e.slice(this.gapFrom, this.gapTo);
        if (t.openStart || t.openEnd) return E.fail('Gap is not a flat range');
        let n = this.slice.insertAt(this.insert, t.content);
        return n ? E.fromReplace(e, this.from, this.to, n) : E.fail('Content does not fit in gap');
    }
    getMap() {
        return new te([
            this.from,
            this.gapFrom - this.from,
            this.insert,
            this.gapTo,
            this.to - this.gapTo,
            this.slice.size - this.insert,
        ]);
    }
    invert(e) {
        let t = this.gapTo - this.gapFrom;
        return new r(
            this.from,
            this.from + this.slice.size + t,
            this.from + this.insert,
            this.from + this.insert + t,
            e.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from),
            this.gapFrom - this.from,
            this.structure,
        );
    }
    map(e) {
        let t = e.mapResult(this.from, 1),
            n = e.mapResult(this.to, -1),
            i = this.from == this.gapFrom ? t.pos : e.map(this.gapFrom, -1),
            s = this.to == this.gapTo ? n.pos : e.map(this.gapTo, 1);
        return (t.deletedAcross && n.deletedAcross) || i < t.pos || s > n.pos
            ? null
            : new r(t.pos, n.pos, i, s, this.slice, this.insert, this.structure);
    }
    toJSON() {
        let e = {
            stepType: 'replaceAround',
            from: this.from,
            to: this.to,
            gapFrom: this.gapFrom,
            gapTo: this.gapTo,
            insert: this.insert,
        };
        return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
    }
    static fromJSON(e, t) {
        if (
            typeof t.from != 'number' ||
            typeof t.to != 'number' ||
            typeof t.gapFrom != 'number' ||
            typeof t.gapTo != 'number' ||
            typeof t.insert != 'number'
        )
            throw new RangeError('Invalid input for ReplaceAroundStep.fromJSON');
        return new r(t.from, t.to, t.gapFrom, t.gapTo, x.fromJSON(e, t.slice), t.insert, !!t.structure);
    }
};
D.jsonID('replaceAround', T);
function dn(r, e, t) {
    let n = r.resolve(e),
        i = t - e,
        s = n.depth;
    for (; i > 0 && s > 0 && n.indexAfter(s) == n.node(s).childCount; ) s--, i--;
    if (i > 0) {
        let o = n.node(s).maybeChild(n.indexAfter(s));
        for (; i > 0; ) {
            if (!o || o.isLeaf) return !0;
            (o = o.firstChild), i--;
        }
    }
    return !1;
}
function Qs(r, e, t, n) {
    let i = [],
        s = [],
        o,
        l;
    r.doc.nodesBetween(e, t, (a, f, c) => {
        if (!a.isInline) return;
        let h = a.marks;
        if (!n.isInSet(h) && c.type.allowsMarkType(n.type)) {
            let u = Math.max(f, e),
                p = Math.min(f + a.nodeSize, t),
                d = n.addToSet(h);
            for (let m = 0; m < h.length; m++)
                h[m].isInSet(d) || (o && o.to == u && o.mark.eq(h[m]) ? (o.to = p) : i.push((o = new Ne(u, p, h[m]))));
            l && l.to == u ? (l.to = p) : s.push((l = new it(u, p, n)));
        }
    }),
        i.forEach((a) => r.step(a)),
        s.forEach((a) => r.step(a));
}
function _s(r, e, t, n) {
    let i = [],
        s = 0;
    r.doc.nodesBetween(e, t, (o, l) => {
        if (!o.isInline) return;
        s++;
        let a = null;
        if (n instanceof Ze) {
            let f = o.marks,
                c;
            for (; (c = n.isInSet(f)); ) (a || (a = [])).push(c), (f = c.removeFromSet(f));
        } else n ? n.isInSet(o.marks) && (a = [n]) : (a = o.marks);
        if (a && a.length) {
            let f = Math.min(l + o.nodeSize, t);
            for (let c = 0; c < a.length; c++) {
                let h = a[c],
                    u;
                for (let p = 0; p < i.length; p++) {
                    let d = i[p];
                    d.step == s - 1 && h.eq(i[p].style) && (u = d);
                }
                u ? ((u.to = f), (u.step = s)) : i.push({ style: h, from: Math.max(l, e), to: f, step: s });
            }
        }
    }),
        i.forEach((o) => r.step(new Ne(o.from, o.to, o.style)));
}
function gn(r, e, t, n = t.contentMatch, i = !0) {
    let s = r.doc.nodeAt(e),
        o = [],
        l = e + 1;
    for (let a = 0; a < s.childCount; a++) {
        let f = s.child(a),
            c = l + f.nodeSize,
            h = n.matchType(f.type);
        if (!h) o.push(new L(l, c, x.empty));
        else {
            n = h;
            for (let u = 0; u < f.marks.length; u++) t.allowsMarkType(f.marks[u].type) || r.step(new Ne(l, c, f.marks[u]));
            if (i && f.isText && t.whitespace != 'pre') {
                let u,
                    p = /\r?\n|\r/g,
                    d;
                for (; (u = p.exec(f.text)); )
                    d || (d = new x(y.from(t.schema.text(' ', t.allowedMarks(f.marks))), 0, 0)),
                        o.push(new L(l + u.index, l + u.index + u[0].length, d));
            }
        }
        l = c;
    }
    if (!n.validEnd) {
        let a = n.fillBefore(y.empty, !0);
        r.replace(l, l, new x(a, 0, 0));
    }
    for (let a = o.length - 1; a >= 0; a--) r.step(o[a]);
}
function eo(r, e, t) {
    return (e == 0 || r.canReplace(e, r.childCount)) && (t == r.childCount || r.canReplace(0, t));
}
function we(r) {
    let t = r.parent.content.cutByIndex(r.startIndex, r.endIndex);
    for (let n = r.depth; ; --n) {
        let i = r.$from.node(n),
            s = r.$from.index(n),
            o = r.$to.indexAfter(n);
        if (n < r.depth && i.canReplace(s, o, t)) return n;
        if (n == 0 || i.type.spec.isolating || !eo(i, s, o)) break;
    }
    return null;
}
function to(r, e, t) {
    let { $from: n, $to: i, depth: s } = e,
        o = n.before(s + 1),
        l = i.after(s + 1),
        a = o,
        f = l,
        c = y.empty,
        h = 0;
    for (let d = s, m = !1; d > t; d--) m || n.index(d) > 0 ? ((m = !0), (c = y.from(n.node(d).copy(c))), h++) : a--;
    let u = y.empty,
        p = 0;
    for (let d = s, m = !1; d > t; d--) m || i.after(d + 1) < i.end(d) ? ((m = !0), (u = y.from(i.node(d).copy(u))), p++) : f++;
    r.step(new T(a, f, o, l, new x(c.append(u), h, p), c.size - h, !0));
}
function Pt(r, e, t = null, n = r) {
    let i = no(r, e),
        s = i && ro(n, e);
    return s ? i.map(Fr).concat({ type: e, attrs: t }).concat(s.map(Fr)) : null;
}
function Fr(r) {
    return { type: r, attrs: null };
}
function no(r, e) {
    let { parent: t, startIndex: n, endIndex: i } = r,
        s = t.contentMatchAt(n).findWrapping(e);
    if (!s) return null;
    let o = s.length ? s[0] : e;
    return t.canReplaceWith(n, i, o) ? s : null;
}
function ro(r, e) {
    let { parent: t, startIndex: n, endIndex: i } = r,
        s = t.child(n),
        o = e.contentMatch.findWrapping(s.type);
    if (!o) return null;
    let a = (o.length ? o[o.length - 1] : e).contentMatch;
    for (let f = n; a && f < i; f++) a = a.matchType(t.child(f).type);
    return !a || !a.validEnd ? null : o;
}
function io(r, e, t) {
    let n = y.empty;
    for (let o = t.length - 1; o >= 0; o--) {
        if (n.size) {
            let l = t[o].type.contentMatch.matchFragment(n);
            if (!l || !l.validEnd)
                throw new RangeError('Wrapper type given to Transform.wrap does not form valid content of its parent wrapper');
        }
        n = y.from(t[o].type.create(t[o].attrs, n));
    }
    let i = e.start,
        s = e.end;
    r.step(new T(i, s, i, s, new x(n, 0, 0), t.length, !0));
}
function so(r, e, t, n, i) {
    if (!n.isTextblock) throw new RangeError('Type given to setBlockType should be a textblock');
    let s = r.steps.length;
    r.doc.nodesBetween(e, t, (o, l) => {
        let a = typeof i == 'function' ? i(o) : i;
        if (o.isTextblock && !o.hasMarkup(n, a) && oo(r.doc, r.mapping.slice(s).map(l), n)) {
            let f = null;
            if (n.schema.linebreakReplacement) {
                let p = n.whitespace == 'pre',
                    d = !!n.contentMatch.matchType(n.schema.linebreakReplacement);
                p && !d ? (f = !1) : !p && d && (f = !0);
            }
            f === !1 && qr(r, o, l, s), gn(r, r.mapping.slice(s).map(l, 1), n, void 0, f === null);
            let c = r.mapping.slice(s),
                h = c.map(l, 1),
                u = c.map(l + o.nodeSize, 1);
            return (
                r.step(new T(h, u, h + 1, u - 1, new x(y.from(n.create(a, null, o.marks)), 0, 0), 1, !0)),
                f === !0 && $r(r, o, l, s),
                !1
            );
        }
    });
}
function $r(r, e, t, n) {
    e.forEach((i, s) => {
        if (i.isText) {
            let o,
                l = /\r?\n|\r/g;
            for (; (o = l.exec(i.text)); ) {
                let a = r.mapping.slice(n).map(t + 1 + s + o.index);
                r.replaceWith(a, a + 1, e.type.schema.linebreakReplacement.create());
            }
        }
    });
}
function qr(r, e, t, n) {
    e.forEach((i, s) => {
        if (i.type == i.type.schema.linebreakReplacement) {
            let o = r.mapping.slice(n).map(t + 1 + s);
            r.replaceWith(
                o,
                o + 1,
                e.type.schema.text(`
`),
            );
        }
    });
}
function oo(r, e, t) {
    let n = r.resolve(e),
        i = n.index();
    return n.parent.canReplaceWith(i, i + 1, t);
}
function lo(r, e, t, n, i) {
    let s = r.doc.nodeAt(e);
    if (!s) throw new RangeError('No node at given position');
    t || (t = s.type);
    let o = t.create(n, null, i || s.marks);
    if (s.isLeaf) return r.replaceWith(e, e + s.nodeSize, o);
    if (!t.validContent(s.content)) throw new RangeError('Invalid content for node type ' + t.name);
    r.step(new T(e, e + s.nodeSize, e + 1, e + s.nodeSize - 1, new x(y.from(o), 0, 0), 1, !0));
}
function fe(r, e, t = 1, n) {
    let i = r.resolve(e),
        s = i.depth - t,
        o = (n && n[n.length - 1]) || i.parent;
    if (
        s < 0 ||
        i.parent.type.spec.isolating ||
        !i.parent.canReplace(i.index(), i.parent.childCount) ||
        !o.type.validContent(i.parent.content.cutByIndex(i.index(), i.parent.childCount))
    )
        return !1;
    for (let f = i.depth - 1, c = t - 2; f > s; f--, c--) {
        let h = i.node(f),
            u = i.index(f);
        if (h.type.spec.isolating) return !1;
        let p = h.content.cutByIndex(u, h.childCount),
            d = n && n[c + 1];
        d && (p = p.replaceChild(0, d.type.create(d.attrs)));
        let m = (n && n[c]) || h;
        if (!h.canReplace(u + 1, h.childCount) || !m.type.validContent(p)) return !1;
    }
    let l = i.indexAfter(s),
        a = n && n[0];
    return i.node(s).canReplaceWith(l, l, a ? a.type : i.node(s + 1).type);
}
function ao(r, e, t = 1, n) {
    let i = r.doc.resolve(e),
        s = y.empty,
        o = y.empty;
    for (let l = i.depth, a = i.depth - t, f = t - 1; l > a; l--, f--) {
        s = y.from(i.node(l).copy(s));
        let c = n && n[f];
        o = y.from(c ? c.type.create(c.attrs, o) : i.node(l).copy(o));
    }
    r.step(new L(e, e, new x(s.append(o), t, t), !0));
}
function ce(r, e) {
    let t = r.resolve(e),
        n = t.index();
    return Kr(t.nodeBefore, t.nodeAfter) && t.parent.canReplace(n, n + 1);
}
function fo(r, e) {
    e.content.size || r.type.compatibleContent(e.type);
    let t = r.contentMatchAt(r.childCount),
        { linebreakReplacement: n } = r.type.schema;
    for (let i = 0; i < e.childCount; i++) {
        let s = e.child(i),
            o = s.type == n ? r.type.schema.nodes.text : s.type;
        if (((t = t.matchType(o)), !t || !r.type.allowsMarks(s.marks))) return !1;
    }
    return t.validEnd;
}
function Kr(r, e) {
    return !!(r && e && !r.isLeaf && fo(r, e));
}
function yn(r, e, t = -1) {
    let n = r.resolve(e);
    for (let i = n.depth; ; i--) {
        let s,
            o,
            l = n.index(i);
        if (
            (i == n.depth
                ? ((s = n.nodeBefore), (o = n.nodeAfter))
                : t > 0
                  ? ((s = n.node(i + 1)), l++, (o = n.node(i).maybeChild(l)))
                  : ((s = n.node(i).maybeChild(l - 1)), (o = n.node(i + 1))),
            s && !s.isTextblock && Kr(s, o) && n.node(i).canReplace(l, l + 1))
        )
            return e;
        if (i == 0) break;
        e = t < 0 ? n.before(i) : n.after(i);
    }
}
function co(r, e, t) {
    let n = null,
        { linebreakReplacement: i } = r.doc.type.schema,
        s = r.doc.resolve(e - t),
        o = s.node().type;
    if (i && o.inlineContent) {
        let c = o.whitespace == 'pre',
            h = !!o.contentMatch.matchType(i);
        c && !h ? (n = !1) : !c && h && (n = !0);
    }
    let l = r.steps.length;
    if (n === !1) {
        let c = r.doc.resolve(e + t);
        qr(r, c.node(), c.before(), l);
    }
    o.inlineContent && gn(r, e + t - 1, o, s.node().contentMatchAt(s.index()), n == null);
    let a = r.mapping.slice(l),
        f = a.map(e - t);
    if ((r.step(new L(f, a.map(e + t, -1), x.empty, !0)), n === !0)) {
        let c = r.doc.resolve(f);
        $r(r, c.node(), c.before(), r.steps.length);
    }
    return r;
}
function ho(r, e, t) {
    let n = r.resolve(e);
    if (n.parent.canReplaceWith(n.index(), n.index(), t)) return e;
    if (n.parentOffset == 0)
        for (let i = n.depth - 1; i >= 0; i--) {
            let s = n.index(i);
            if (n.node(i).canReplaceWith(s, s, t)) return n.before(i + 1);
            if (s > 0) return null;
        }
    if (n.parentOffset == n.parent.content.size)
        for (let i = n.depth - 1; i >= 0; i--) {
            let s = n.indexAfter(i);
            if (n.node(i).canReplaceWith(s, s, t)) return n.after(i + 1);
            if (s < n.node(i).childCount) return null;
        }
    return null;
}
function Hr(r, e, t) {
    let n = r.resolve(e);
    if (!t.content.size) return e;
    let i = t.content;
    for (let s = 0; s < t.openStart; s++) i = i.firstChild.content;
    for (let s = 1; s <= (t.openStart == 0 && t.size ? 2 : 1); s++)
        for (let o = n.depth; o >= 0; o--) {
            let l = o == n.depth ? 0 : n.pos <= (n.start(o + 1) + n.end(o + 1)) / 2 ? -1 : 1,
                a = n.index(o) + (l > 0 ? 1 : 0),
                f = n.node(o),
                c = !1;
            if (s == 1) c = f.canReplace(a, a, i);
            else {
                let h = f.contentMatchAt(a).findWrapping(i.firstChild.type);
                c = h && f.canReplaceWith(a, a, h[0]);
            }
            if (c) return l == 0 ? n.pos : l < 0 ? n.before(o + 1) : n.after(o + 1);
        }
    return null;
}
function lt(r, e, t = e, n = x.empty) {
    if (e == t && !n.size) return null;
    let i = r.resolve(e),
        s = r.resolve(t);
    return jr(i, s, n) ? new L(e, t, n) : new pn(i, s, n).fit();
}
function jr(r, e, t) {
    return !t.openStart && !t.openEnd && r.start() == e.start() && r.parent.canReplace(r.index(), e.index(), t.content);
}
var pn = class {
    constructor(e, t, n) {
        (this.$from = e), (this.$to = t), (this.unplaced = n), (this.frontier = []), (this.placed = y.empty);
        for (let i = 0; i <= e.depth; i++) {
            let s = e.node(i);
            this.frontier.push({ type: s.type, match: s.contentMatchAt(e.indexAfter(i)) });
        }
        for (let i = e.depth; i > 0; i--) this.placed = y.from(e.node(i).copy(this.placed));
    }
    get depth() {
        return this.frontier.length - 1;
    }
    fit() {
        for (; this.unplaced.size; ) {
            let f = this.findFittable();
            f ? this.placeNodes(f) : this.openMore() || this.dropNode();
        }
        let e = this.mustMoveInline(),
            t = this.placed.size - this.depth - this.$from.depth,
            n = this.$from,
            i = this.close(e < 0 ? this.$to : n.doc.resolve(e));
        if (!i) return null;
        let s = this.placed,
            o = n.depth,
            l = i.depth;
        for (; o && l && s.childCount == 1; ) (s = s.firstChild.content), o--, l--;
        let a = new x(s, o, l);
        return e > -1
            ? new T(n.pos, e, this.$to.pos, this.$to.end(), a, t)
            : a.size || n.pos != this.$to.pos
              ? new L(n.pos, i.pos, a)
              : null;
    }
    findFittable() {
        let e = this.unplaced.openStart;
        for (let t = this.unplaced.content, n = 0, i = this.unplaced.openEnd; n < e; n++) {
            let s = t.firstChild;
            if ((t.childCount > 1 && (i = 0), s.type.spec.isolating && i <= n)) {
                e = n;
                break;
            }
            t = s.content;
        }
        for (let t = 1; t <= 2; t++)
            for (let n = t == 1 ? e : this.unplaced.openStart; n >= 0; n--) {
                let i,
                    s = null;
                n ? ((s = hn(this.unplaced.content, n - 1).firstChild), (i = s.content)) : (i = this.unplaced.content);
                let o = i.firstChild;
                for (let l = this.depth; l >= 0; l--) {
                    let { type: a, match: f } = this.frontier[l],
                        c,
                        h = null;
                    if (
                        t == 1 &&
                        (o ? f.matchType(o.type) || (h = f.fillBefore(y.from(o), !1)) : s && a.compatibleContent(s.type))
                    )
                        return { sliceDepth: n, frontierDepth: l, parent: s, inject: h };
                    if (t == 2 && o && (c = f.findWrapping(o.type)))
                        return { sliceDepth: n, frontierDepth: l, parent: s, wrap: c };
                    if (s && f.matchType(s.type)) break;
                }
            }
    }
    openMore() {
        let { content: e, openStart: t, openEnd: n } = this.unplaced,
            i = hn(e, t);
        return !i.childCount || i.firstChild.isLeaf
            ? !1
            : ((this.unplaced = new x(e, t + 1, Math.max(n, i.size + t >= e.size - n ? t + 1 : 0))), !0);
    }
    dropNode() {
        let { content: e, openStart: t, openEnd: n } = this.unplaced,
            i = hn(e, t);
        if (i.childCount <= 1 && t > 0) {
            let s = e.size - t <= t + i.size;
            this.unplaced = new x(et(e, t - 1, 1), t - 1, s ? t - 1 : n);
        } else this.unplaced = new x(et(e, t, 1), t, n);
    }
    placeNodes({ sliceDepth: e, frontierDepth: t, parent: n, inject: i, wrap: s }) {
        for (; this.depth > t; ) this.closeFrontierNode();
        if (s) for (let m = 0; m < s.length; m++) this.openFrontierNode(s[m]);
        let o = this.unplaced,
            l = n ? n.content : o.content,
            a = o.openStart - e,
            f = 0,
            c = [],
            { match: h, type: u } = this.frontier[t];
        if (i) {
            for (let m = 0; m < i.childCount; m++) c.push(i.child(m));
            h = h.matchFragment(i);
        }
        let p = l.size + e - (o.content.size - o.openEnd);
        for (; f < l.childCount; ) {
            let m = l.child(f),
                g = h.matchType(m.type);
            if (!g) break;
            f++,
                (f > 1 || a == 0 || m.content.size) &&
                    ((h = g), c.push(Ur(m.mark(u.allowedMarks(m.marks)), f == 1 ? a : 0, f == l.childCount ? p : -1)));
        }
        let d = f == l.childCount;
        d || (p = -1),
            (this.placed = tt(this.placed, t, y.from(c))),
            (this.frontier[t].match = h),
            d && p < 0 && n && n.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
        for (let m = 0, g = l; m < p; m++) {
            let b = g.lastChild;
            this.frontier.push({ type: b.type, match: b.contentMatchAt(b.childCount) }), (g = b.content);
        }
        this.unplaced = d
            ? e == 0
                ? x.empty
                : new x(et(o.content, e - 1, 1), e - 1, p < 0 ? o.openEnd : e - 1)
            : new x(et(o.content, e, f), o.openStart, o.openEnd);
    }
    mustMoveInline() {
        if (!this.$to.parent.isTextblock) return -1;
        let e = this.frontier[this.depth],
            t;
        if (
            !e.type.isTextblock ||
            !un(this.$to, this.$to.depth, e.type, e.match, !1) ||
            (this.$to.depth == this.depth && (t = this.findCloseLevel(this.$to)) && t.depth == this.depth)
        )
            return -1;
        let { depth: n } = this.$to,
            i = this.$to.after(n);
        for (; n > 1 && i == this.$to.end(--n); ) ++i;
        return i;
    }
    findCloseLevel(e) {
        e: for (let t = Math.min(this.depth, e.depth); t >= 0; t--) {
            let { match: n, type: i } = this.frontier[t],
                s = t < e.depth && e.end(t + 1) == e.pos + (e.depth - (t + 1)),
                o = un(e, t, i, n, s);
            if (o) {
                for (let l = t - 1; l >= 0; l--) {
                    let { match: a, type: f } = this.frontier[l],
                        c = un(e, l, f, a, !0);
                    if (!c || c.childCount) continue e;
                }
                return { depth: t, fit: o, move: s ? e.doc.resolve(e.after(t + 1)) : e };
            }
        }
    }
    close(e) {
        let t = this.findCloseLevel(e);
        if (!t) return null;
        for (; this.depth > t.depth; ) this.closeFrontierNode();
        t.fit.childCount && (this.placed = tt(this.placed, t.depth, t.fit)), (e = t.move);
        for (let n = t.depth + 1; n <= e.depth; n++) {
            let i = e.node(n),
                s = i.type.contentMatch.fillBefore(i.content, !0, e.index(n));
            this.openFrontierNode(i.type, i.attrs, s);
        }
        return e;
    }
    openFrontierNode(e, t = null, n) {
        let i = this.frontier[this.depth];
        (i.match = i.match.matchType(e)),
            (this.placed = tt(this.placed, this.depth, y.from(e.create(t, n)))),
            this.frontier.push({ type: e, match: e.contentMatch });
    }
    closeFrontierNode() {
        let t = this.frontier.pop().match.fillBefore(y.empty, !0);
        t.childCount && (this.placed = tt(this.placed, this.frontier.length, t));
    }
};
function et(r, e, t) {
    return e == 0 ? r.cutByIndex(t, r.childCount) : r.replaceChild(0, r.firstChild.copy(et(r.firstChild.content, e - 1, t)));
}
function tt(r, e, t) {
    return e == 0 ? r.append(t) : r.replaceChild(r.childCount - 1, r.lastChild.copy(tt(r.lastChild.content, e - 1, t)));
}
function hn(r, e) {
    for (let t = 0; t < e; t++) r = r.firstChild.content;
    return r;
}
function Ur(r, e, t) {
    if (e <= 0) return r;
    let n = r.content;
    return (
        e > 1 && (n = n.replaceChild(0, Ur(n.firstChild, e - 1, n.childCount == 1 ? t - 1 : 0))),
        e > 0 &&
            ((n = r.type.contentMatch.fillBefore(n).append(n)),
            t <= 0 && (n = n.append(r.type.contentMatch.matchFragment(n).fillBefore(y.empty, !0)))),
        r.copy(n)
    );
}
function un(r, e, t, n, i) {
    let s = r.node(e),
        o = i ? r.indexAfter(e) : r.index(e);
    if (o == s.childCount && !t.compatibleContent(s.type)) return null;
    let l = n.fillBefore(s.content, !0, o);
    return l && !uo(t, s.content, o) ? l : null;
}
function uo(r, e, t) {
    for (let n = t; n < e.childCount; n++) if (!r.allowsMarks(e.child(n).marks)) return !0;
    return !1;
}
function po(r) {
    return r.spec.defining || r.spec.definingForContent;
}
function mo(r, e, t, n) {
    if (!n.size) return r.deleteRange(e, t);
    let i = r.doc.resolve(e),
        s = r.doc.resolve(t);
    if (jr(i, s, n)) return r.step(new L(e, t, n));
    let o = Yr(i, r.doc.resolve(t));
    o[o.length - 1] == 0 && o.pop();
    let l = -(i.depth + 1);
    o.unshift(l);
    for (let u = i.depth, p = i.pos - 1; u > 0; u--, p--) {
        let d = i.node(u).type.spec;
        if (d.defining || d.definingAsContext || d.isolating) break;
        o.indexOf(u) > -1 ? (l = u) : i.before(u) == p && o.splice(1, 0, -u);
    }
    let a = o.indexOf(l),
        f = [],
        c = n.openStart;
    for (let u = n.content, p = 0; ; p++) {
        let d = u.firstChild;
        if ((f.push(d), p == n.openStart)) break;
        u = d.content;
    }
    for (let u = c - 1; u >= 0; u--) {
        let p = f[u],
            d = po(p.type);
        if (d && !p.sameMarkup(i.node(Math.abs(l) - 1))) c = u;
        else if (d || !p.type.isTextblock) break;
    }
    for (let u = n.openStart; u >= 0; u--) {
        let p = (u + c + 1) % (n.openStart + 1),
            d = f[p];
        if (d)
            for (let m = 0; m < o.length; m++) {
                let g = o[(m + a) % o.length],
                    b = !0;
                g < 0 && ((b = !1), (g = -g));
                let N = i.node(g - 1),
                    B = i.index(g - 1);
                if (N.canReplaceWith(B, B, d.type, d.marks))
                    return r.replace(i.before(g), b ? s.after(g) : t, new x(Gr(n.content, 0, n.openStart, p), p, n.openEnd));
            }
    }
    let h = r.steps.length;
    for (let u = o.length - 1; u >= 0 && (r.replace(e, t, n), !(r.steps.length > h)); u--) {
        let p = o[u];
        p < 0 || ((e = i.before(p)), (t = s.after(p)));
    }
}
function Gr(r, e, t, n, i) {
    if (e < t) {
        let s = r.firstChild;
        r = r.replaceChild(0, s.copy(Gr(s.content, e + 1, t, n, s)));
    }
    if (e > n) {
        let s = i.contentMatchAt(0),
            o = s.fillBefore(r).append(r);
        r = o.append(s.matchFragment(o).fillBefore(y.empty, !0));
    }
    return r;
}
function go(r, e, t, n) {
    if (!n.isInline && e == t && r.doc.resolve(e).parent.content.size) {
        let i = ho(r.doc, e, n.type);
        i != null && (e = t = i);
    }
    r.replaceRange(e, t, new x(y.from(n), 0, 0));
}
function yo(r, e, t) {
    let n = r.doc.resolve(e),
        i = r.doc.resolve(t),
        s = Yr(n, i);
    for (let o = 0; o < s.length; o++) {
        let l = s[o],
            a = o == s.length - 1;
        if ((a && l == 0) || n.node(l).type.contentMatch.validEnd) return r.delete(n.start(l), i.end(l));
        if (l > 0 && (a || n.node(l - 1).canReplace(n.index(l - 1), i.indexAfter(l - 1))))
            return r.delete(n.before(l), i.after(l));
    }
    for (let o = 1; o <= n.depth && o <= i.depth; o++)
        if (
            e - n.start(o) == n.depth - o &&
            t > n.end(o) &&
            i.end(o) - t != i.depth - o &&
            n.start(o - 1) == i.start(o - 1) &&
            n.node(o - 1).canReplace(n.index(o - 1), i.index(o - 1))
        )
            return r.delete(n.before(o), t);
    r.delete(e, t);
}
function Yr(r, e) {
    let t = [],
        n = Math.min(r.depth, e.depth);
    for (let i = n; i >= 0; i--) {
        let s = r.start(i);
        if (
            s < r.pos - (r.depth - i) ||
            e.end(i) > e.pos + (e.depth - i) ||
            r.node(i).type.spec.isolating ||
            e.node(i).type.spec.isolating
        )
            break;
        (s == e.start(i) ||
            (i == r.depth &&
                i == e.depth &&
                r.parent.inlineContent &&
                e.parent.inlineContent &&
                i &&
                e.start(i - 1) == s - 1)) &&
            t.push(i);
    }
    return t;
}
var It = class r extends D {
    constructor(e, t, n) {
        super(), (this.pos = e), (this.attr = t), (this.value = n);
    }
    apply(e) {
        let t = e.nodeAt(this.pos);
        if (!t) return E.fail("No node at attribute step's position");
        let n = Object.create(null);
        for (let s in t.attrs) n[s] = t.attrs[s];
        n[this.attr] = this.value;
        let i = t.type.create(n, null, t.marks);
        return E.fromReplace(e, this.pos, this.pos + 1, new x(y.from(i), 0, t.isLeaf ? 0 : 1));
    }
    getMap() {
        return te.empty;
    }
    invert(e) {
        return new r(this.pos, this.attr, e.nodeAt(this.pos).attrs[this.attr]);
    }
    map(e) {
        let t = e.mapResult(this.pos, 1);
        return t.deletedAfter ? null : new r(t.pos, this.attr, this.value);
    }
    toJSON() {
        return { stepType: 'attr', pos: this.pos, attr: this.attr, value: this.value };
    }
    static fromJSON(e, t) {
        if (typeof t.pos != 'number' || typeof t.attr != 'string') throw new RangeError('Invalid input for AttrStep.fromJSON');
        return new r(t.pos, t.attr, t.value);
    }
};
D.jsonID('attr', It);
var Rt = class r extends D {
    constructor(e, t) {
        super(), (this.attr = e), (this.value = t);
    }
    apply(e) {
        let t = Object.create(null);
        for (let i in e.attrs) t[i] = e.attrs[i];
        t[this.attr] = this.value;
        let n = e.type.create(t, e.content, e.marks);
        return E.ok(n);
    }
    getMap() {
        return te.empty;
    }
    invert(e) {
        return new r(this.attr, e.attrs[this.attr]);
    }
    map(e) {
        return this;
    }
    toJSON() {
        return { stepType: 'docAttr', attr: this.attr, value: this.value };
    }
    static fromJSON(e, t) {
        if (typeof t.attr != 'string') throw new RangeError('Invalid input for DocAttrStep.fromJSON');
        return new r(t.attr, t.value);
    }
};
D.jsonID('docAttr', Rt);
var Ve = class extends Error {};
Ve = function r(e) {
    let t = Error.call(this, e);
    return (t.__proto__ = r.prototype), t;
};
Ve.prototype = Object.create(Error.prototype);
Ve.prototype.constructor = Ve;
Ve.prototype.name = 'TransformError';
var zt = class {
    constructor(e) {
        (this.doc = e), (this.steps = []), (this.docs = []), (this.mapping = new rt());
    }
    get before() {
        return this.docs.length ? this.docs[0] : this.doc;
    }
    step(e) {
        let t = this.maybeStep(e);
        if (t.failed) throw new Ve(t.failed);
        return this;
    }
    maybeStep(e) {
        let t = e.apply(this.doc);
        return t.failed || this.addStep(e, t.doc), t;
    }
    get docChanged() {
        return this.steps.length > 0;
    }
    addStep(e, t) {
        this.docs.push(this.doc), this.steps.push(e), this.mapping.appendMap(e.getMap()), (this.doc = t);
    }
    replace(e, t = e, n = x.empty) {
        let i = lt(this.doc, e, t, n);
        return i && this.step(i), this;
    }
    replaceWith(e, t, n) {
        return this.replace(e, t, new x(y.from(n), 0, 0));
    }
    delete(e, t) {
        return this.replace(e, t, x.empty);
    }
    insert(e, t) {
        return this.replaceWith(e, e, t);
    }
    replaceRange(e, t, n) {
        return mo(this, e, t, n), this;
    }
    replaceRangeWith(e, t, n) {
        return go(this, e, t, n), this;
    }
    deleteRange(e, t) {
        return yo(this, e, t), this;
    }
    lift(e, t) {
        return to(this, e, t), this;
    }
    join(e, t = 1) {
        return co(this, e, t), this;
    }
    wrap(e, t) {
        return io(this, e, t), this;
    }
    setBlockType(e, t = e, n, i = null) {
        return so(this, e, t, n, i), this;
    }
    setNodeMarkup(e, t, n = null, i) {
        return lo(this, e, t, n, i), this;
    }
    setNodeAttribute(e, t, n) {
        return this.step(new It(e, t, n)), this;
    }
    setDocAttribute(e, t) {
        return this.step(new Rt(e, t)), this;
    }
    addNodeMark(e, t) {
        return this.step(new st(e, t)), this;
    }
    removeNodeMark(e, t) {
        if (!(t instanceof C)) {
            let n = this.doc.nodeAt(e);
            if (!n) throw new RangeError('No node at position ' + e);
            if (((t = t.isInSet(n.marks)), !t)) return this;
        }
        return this.step(new ot(e, t)), this;
    }
    split(e, t = 1, n) {
        return ao(this, e, t, n), this;
    }
    addMark(e, t, n) {
        return Qs(this, e, t, n), this;
    }
    removeMark(e, t, n) {
        return _s(this, e, t, n), this;
    }
    clearIncompatible(e, t, n) {
        return gn(this, e, t, n), this;
    }
};
var xn = Object.create(null),
    k = class {
        constructor(e, t, n) {
            (this.$anchor = e), (this.$head = t), (this.ranges = n || [new Je(e.min(t), e.max(t))]);
        }
        get anchor() {
            return this.$anchor.pos;
        }
        get head() {
            return this.$head.pos;
        }
        get from() {
            return this.$from.pos;
        }
        get to() {
            return this.$to.pos;
        }
        get $from() {
            return this.ranges[0].$from;
        }
        get $to() {
            return this.ranges[0].$to;
        }
        get empty() {
            let e = this.ranges;
            for (let t = 0; t < e.length; t++) if (e[t].$from.pos != e[t].$to.pos) return !1;
            return !0;
        }
        content() {
            return this.$from.doc.slice(this.from, this.to, !0);
        }
        replace(e, t = x.empty) {
            let n = t.content.lastChild,
                i = null;
            for (let l = 0; l < t.openEnd; l++) (i = n), (n = n.lastChild);
            let s = e.steps.length,
                o = this.ranges;
            for (let l = 0; l < o.length; l++) {
                let { $from: a, $to: f } = o[l],
                    c = e.mapping.slice(s);
                e.replaceRange(c.map(a.pos), c.map(f.pos), l ? x.empty : t),
                    l == 0 && Qr(e, s, (n ? n.isInline : i && i.isTextblock) ? -1 : 1);
            }
        }
        replaceWith(e, t) {
            let n = e.steps.length,
                i = this.ranges;
            for (let s = 0; s < i.length; s++) {
                let { $from: o, $to: l } = i[s],
                    a = e.mapping.slice(n),
                    f = a.map(o.pos),
                    c = a.map(l.pos);
                s ? e.deleteRange(f, c) : (e.replaceRangeWith(f, c, t), Qr(e, n, t.isInline ? -1 : 1));
            }
        }
        static findFrom(e, t, n = !1) {
            let i = e.parent.inlineContent ? new O(e) : Le(e.node(0), e.parent, e.pos, e.index(), t, n);
            if (i) return i;
            for (let s = e.depth - 1; s >= 0; s--) {
                let o =
                    t < 0
                        ? Le(e.node(0), e.node(s), e.before(s + 1), e.index(s), t, n)
                        : Le(e.node(0), e.node(s), e.after(s + 1), e.index(s) + 1, t, n);
                if (o) return o;
            }
            return null;
        }
        static near(e, t = 1) {
            return this.findFrom(e, t) || this.findFrom(e, -t) || new $(e.node(0));
        }
        static atStart(e) {
            return Le(e, e, 0, 0, 1) || new $(e);
        }
        static atEnd(e) {
            return Le(e, e, e.content.size, e.childCount, -1) || new $(e);
        }
        static fromJSON(e, t) {
            if (!t || !t.type) throw new RangeError('Invalid input for Selection.fromJSON');
            let n = xn[t.type];
            if (!n) throw new RangeError(`No selection type ${t.type} defined`);
            return n.fromJSON(e, t);
        }
        static jsonID(e, t) {
            if (e in xn) throw new RangeError('Duplicate use of selection JSON ID ' + e);
            return (xn[e] = t), (t.prototype.jsonID = e), t;
        }
        getBookmark() {
            return O.between(this.$anchor, this.$head).getBookmark();
        }
    };
k.prototype.visible = !0;
var Je = class {
        constructor(e, t) {
            (this.$from = e), (this.$to = t);
        }
    },
    Xr = !1;
function Zr(r) {
    !Xr &&
        !r.parent.inlineContent &&
        ((Xr = !0),
        console.warn('TextSelection endpoint not pointing into a node with inline content (' + r.parent.type.name + ')'));
}
var O = class r extends k {
    constructor(e, t = e) {
        Zr(e), Zr(t), super(e, t);
    }
    get $cursor() {
        return this.$anchor.pos == this.$head.pos ? this.$head : null;
    }
    map(e, t) {
        let n = e.resolve(t.map(this.head));
        if (!n.parent.inlineContent) return k.near(n);
        let i = e.resolve(t.map(this.anchor));
        return new r(i.parent.inlineContent ? i : n, n);
    }
    replace(e, t = x.empty) {
        if ((super.replace(e, t), t == x.empty)) {
            let n = this.$from.marksAcross(this.$to);
            n && e.ensureMarks(n);
        }
    }
    eq(e) {
        return e instanceof r && e.anchor == this.anchor && e.head == this.head;
    }
    getBookmark() {
        return new Ft(this.anchor, this.head);
    }
    toJSON() {
        return { type: 'text', anchor: this.anchor, head: this.head };
    }
    static fromJSON(e, t) {
        if (typeof t.anchor != 'number' || typeof t.head != 'number')
            throw new RangeError('Invalid input for TextSelection.fromJSON');
        return new r(e.resolve(t.anchor), e.resolve(t.head));
    }
    static create(e, t, n = t) {
        let i = e.resolve(t);
        return new this(i, n == t ? i : e.resolve(n));
    }
    static between(e, t, n) {
        let i = e.pos - t.pos;
        if (((!n || i) && (n = i >= 0 ? 1 : -1), !t.parent.inlineContent)) {
            let s = k.findFrom(t, n, !0) || k.findFrom(t, -n, !0);
            if (s) t = s.$head;
            else return k.near(t, n);
        }
        return (
            e.parent.inlineContent ||
                (i == 0
                    ? (e = t)
                    : ((e = (k.findFrom(e, -n, !0) || k.findFrom(e, n, !0)).$anchor), e.pos < t.pos != i < 0 && (e = t))),
            new r(e, t)
        );
    }
};
k.jsonID('text', O);
var Ft = class r {
        constructor(e, t) {
            (this.anchor = e), (this.head = t);
        }
        map(e) {
            return new r(e.map(this.anchor), e.map(this.head));
        }
        resolve(e) {
            return O.between(e.resolve(this.anchor), e.resolve(this.head));
        }
    },
    S = class r extends k {
        constructor(e) {
            let t = e.nodeAfter,
                n = e.node(0).resolve(e.pos + t.nodeSize);
            super(e, n), (this.node = t);
        }
        map(e, t) {
            let { deleted: n, pos: i } = t.mapResult(this.anchor),
                s = e.resolve(i);
            return n ? k.near(s) : new r(s);
        }
        content() {
            return new x(y.from(this.node), 0, 0);
        }
        eq(e) {
            return e instanceof r && e.anchor == this.anchor;
        }
        toJSON() {
            return { type: 'node', anchor: this.anchor };
        }
        getBookmark() {
            return new Sn(this.anchor);
        }
        static fromJSON(e, t) {
            if (typeof t.anchor != 'number') throw new RangeError('Invalid input for NodeSelection.fromJSON');
            return new r(e.resolve(t.anchor));
        }
        static create(e, t) {
            return new r(e.resolve(t));
        }
        static isSelectable(e) {
            return !e.isText && e.type.spec.selectable !== !1;
        }
    };
S.prototype.visible = !1;
k.jsonID('node', S);
var Sn = class r {
        constructor(e) {
            this.anchor = e;
        }
        map(e) {
            let { deleted: t, pos: n } = e.mapResult(this.anchor);
            return t ? new Ft(n, n) : new r(n);
        }
        resolve(e) {
            let t = e.resolve(this.anchor),
                n = t.nodeAfter;
            return n && S.isSelectable(n) ? new S(t) : k.near(t);
        }
    },
    $ = class r extends k {
        constructor(e) {
            super(e.resolve(0), e.resolve(e.content.size));
        }
        replace(e, t = x.empty) {
            if (t == x.empty) {
                e.delete(0, e.doc.content.size);
                let n = k.atStart(e.doc);
                n.eq(e.selection) || e.setSelection(n);
            } else super.replace(e, t);
        }
        toJSON() {
            return { type: 'all' };
        }
        static fromJSON(e) {
            return new r(e);
        }
        map(e) {
            return new r(e);
        }
        eq(e) {
            return e instanceof r;
        }
        getBookmark() {
            return xo;
        }
    };
k.jsonID('all', $);
var xo = {
    map() {
        return this;
    },
    resolve(r) {
        return new $(r);
    },
};
function Le(r, e, t, n, i, s = !1) {
    if (e.inlineContent) return O.create(r, t);
    for (let o = n - (i > 0 ? 0 : 1); i > 0 ? o < e.childCount : o >= 0; o += i) {
        let l = e.child(o);
        if (l.isAtom) {
            if (!s && S.isSelectable(l)) return S.create(r, t - (i < 0 ? l.nodeSize : 0));
        } else {
            let a = Le(r, l, t + i, i < 0 ? l.childCount : 0, i, s);
            if (a) return a;
        }
        t += l.nodeSize * i;
    }
    return null;
}
function Qr(r, e, t) {
    let n = r.steps.length - 1;
    if (n < e) return;
    let i = r.steps[n];
    if (!(i instanceof L || i instanceof T)) return;
    let s = r.mapping.maps[n],
        o;
    s.forEach((l, a, f, c) => {
        o == null && (o = c);
    }),
        r.setSelection(k.near(r.doc.resolve(o), t));
}
var _r = 1,
    Bt = 2,
    ei = 4,
    kn = class extends zt {
        constructor(e) {
            super(e.doc),
                (this.curSelectionFor = 0),
                (this.updated = 0),
                (this.meta = Object.create(null)),
                (this.time = Date.now()),
                (this.curSelection = e.selection),
                (this.storedMarks = e.storedMarks);
        }
        get selection() {
            return (
                this.curSelectionFor < this.steps.length &&
                    ((this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor))),
                    (this.curSelectionFor = this.steps.length)),
                this.curSelection
            );
        }
        setSelection(e) {
            if (e.$from.doc != this.doc)
                throw new RangeError('Selection passed to setSelection must point at the current document');
            return (
                (this.curSelection = e),
                (this.curSelectionFor = this.steps.length),
                (this.updated = (this.updated | _r) & ~Bt),
                (this.storedMarks = null),
                this
            );
        }
        get selectionSet() {
            return (this.updated & _r) > 0;
        }
        setStoredMarks(e) {
            return (this.storedMarks = e), (this.updated |= Bt), this;
        }
        ensureMarks(e) {
            return C.sameSet(this.storedMarks || this.selection.$from.marks(), e) || this.setStoredMarks(e), this;
        }
        addStoredMark(e) {
            return this.ensureMarks(e.addToSet(this.storedMarks || this.selection.$head.marks()));
        }
        removeStoredMark(e) {
            return this.ensureMarks(e.removeFromSet(this.storedMarks || this.selection.$head.marks()));
        }
        get storedMarksSet() {
            return (this.updated & Bt) > 0;
        }
        addStep(e, t) {
            super.addStep(e, t), (this.updated = this.updated & ~Bt), (this.storedMarks = null);
        }
        setTime(e) {
            return (this.time = e), this;
        }
        replaceSelection(e) {
            return this.selection.replace(this, e), this;
        }
        replaceSelectionWith(e, t = !0) {
            let n = this.selection;
            return (
                t && (e = e.mark(this.storedMarks || (n.empty ? n.$from.marks() : n.$from.marksAcross(n.$to) || C.none))),
                n.replaceWith(this, e),
                this
            );
        }
        deleteSelection() {
            return this.selection.replace(this), this;
        }
        insertText(e, t, n) {
            let i = this.doc.type.schema;
            if (t == null) return e ? this.replaceSelectionWith(i.text(e), !0) : this.deleteSelection();
            {
                if ((n == null && (n = t), (n = n ?? t), !e)) return this.deleteRange(t, n);
                let s = this.storedMarks;
                if (!s) {
                    let o = this.doc.resolve(t);
                    s = n == t ? o.marks() : o.marksAcross(this.doc.resolve(n));
                }
                return (
                    this.replaceRangeWith(t, n, i.text(e, s)),
                    this.selection.empty || this.setSelection(k.near(this.selection.$to)),
                    this
                );
            }
        }
        setMeta(e, t) {
            return (this.meta[typeof e == 'string' ? e : e.key] = t), this;
        }
        getMeta(e) {
            return this.meta[typeof e == 'string' ? e : e.key];
        }
        get isGeneric() {
            for (let e in this.meta) return !1;
            return !0;
        }
        scrollIntoView() {
            return (this.updated |= ei), this;
        }
        get scrolledIntoView() {
            return (this.updated & ei) > 0;
        }
    };
function ti(r, e) {
    return !e || !r ? r : r.bind(e);
}
var De = class {
        constructor(e, t, n) {
            (this.name = e), (this.init = ti(t.init, n)), (this.apply = ti(t.apply, n));
        }
    },
    bo = [
        new De('doc', {
            init(r) {
                return r.doc || r.schema.topNodeType.createAndFill();
            },
            apply(r) {
                return r.doc;
            },
        }),
        new De('selection', {
            init(r, e) {
                return r.selection || k.atStart(e.doc);
            },
            apply(r) {
                return r.selection;
            },
        }),
        new De('storedMarks', {
            init(r) {
                return r.storedMarks || null;
            },
            apply(r, e, t, n) {
                return n.selection.$cursor ? r.storedMarks : null;
            },
        }),
        new De('scrollToSelection', {
            init() {
                return 0;
            },
            apply(r, e) {
                return r.scrolledIntoView ? e + 1 : e;
            },
        }),
    ],
    at = class {
        constructor(e, t) {
            (this.schema = e),
                (this.plugins = []),
                (this.pluginsByKey = Object.create(null)),
                (this.fields = bo.slice()),
                t &&
                    t.forEach((n) => {
                        if (this.pluginsByKey[n.key])
                            throw new RangeError('Adding different instances of a keyed plugin (' + n.key + ')');
                        this.plugins.push(n),
                            (this.pluginsByKey[n.key] = n),
                            n.spec.state && this.fields.push(new De(n.key, n.spec.state, n));
                    });
        }
    },
    ni = class r {
        constructor(e) {
            this.config = e;
        }
        get schema() {
            return this.config.schema;
        }
        get plugins() {
            return this.config.plugins;
        }
        apply(e) {
            return this.applyTransaction(e).state;
        }
        filterTransaction(e, t = -1) {
            for (let n = 0; n < this.config.plugins.length; n++)
                if (n != t) {
                    let i = this.config.plugins[n];
                    if (i.spec.filterTransaction && !i.spec.filterTransaction.call(i, e, this)) return !1;
                }
            return !0;
        }
        applyTransaction(e) {
            if (!this.filterTransaction(e)) return { state: this, transactions: [] };
            let t = [e],
                n = this.applyInner(e),
                i = null;
            for (;;) {
                let s = !1;
                for (let o = 0; o < this.config.plugins.length; o++) {
                    let l = this.config.plugins[o];
                    if (l.spec.appendTransaction) {
                        let a = i ? i[o].n : 0,
                            f = i ? i[o].state : this,
                            c = a < t.length && l.spec.appendTransaction.call(l, a ? t.slice(a) : t, f, n);
                        if (c && n.filterTransaction(c, o)) {
                            if ((c.setMeta('appendedTransaction', e), !i)) {
                                i = [];
                                for (let h = 0; h < this.config.plugins.length; h++)
                                    i.push(h < o ? { state: n, n: t.length } : { state: this, n: 0 });
                            }
                            t.push(c), (n = n.applyInner(c)), (s = !0);
                        }
                        i && (i[o] = { state: n, n: t.length });
                    }
                }
                if (!s) return { state: n, transactions: t };
            }
        }
        applyInner(e) {
            if (!e.before.eq(this.doc)) throw new RangeError('Applying a mismatched transaction');
            let t = new r(this.config),
                n = this.config.fields;
            for (let i = 0; i < n.length; i++) {
                let s = n[i];
                t[s.name] = s.apply(e, this[s.name], this, t);
            }
            return t;
        }
        get tr() {
            return new kn(this);
        }
        static create(e) {
            let t = new at(e.doc ? e.doc.type.schema : e.schema, e.plugins),
                n = new r(t);
            for (let i = 0; i < t.fields.length; i++) n[t.fields[i].name] = t.fields[i].init(e, n);
            return n;
        }
        reconfigure(e) {
            let t = new at(this.schema, e.plugins),
                n = t.fields,
                i = new r(t);
            for (let s = 0; s < n.length; s++) {
                let o = n[s].name;
                i[o] = this.hasOwnProperty(o) ? this[o] : n[s].init(e, i);
            }
            return i;
        }
        toJSON(e) {
            let t = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
            if ((this.storedMarks && (t.storedMarks = this.storedMarks.map((n) => n.toJSON())), e && typeof e == 'object'))
                for (let n in e) {
                    if (n == 'doc' || n == 'selection')
                        throw new RangeError('The JSON fields `doc` and `selection` are reserved');
                    let i = e[n],
                        s = i.spec.state;
                    s && s.toJSON && (t[n] = s.toJSON.call(i, this[i.key]));
                }
            return t;
        }
        static fromJSON(e, t, n) {
            if (!t) throw new RangeError('Invalid input for EditorState.fromJSON');
            if (!e.schema) throw new RangeError("Required config field 'schema' missing");
            let i = new at(e.schema, e.plugins),
                s = new r(i);
            return (
                i.fields.forEach((o) => {
                    if (o.name == 'doc') s.doc = X.fromJSON(e.schema, t.doc);
                    else if (o.name == 'selection') s.selection = k.fromJSON(s.doc, t.selection);
                    else if (o.name == 'storedMarks')
                        t.storedMarks && (s.storedMarks = t.storedMarks.map(e.schema.markFromJSON));
                    else {
                        if (n)
                            for (let l in n) {
                                let a = n[l],
                                    f = a.spec.state;
                                if (a.key == o.name && f && f.fromJSON && Object.prototype.hasOwnProperty.call(t, l)) {
                                    s[o.name] = f.fromJSON.call(a, e, t[l], s);
                                    return;
                                }
                            }
                        s[o.name] = o.init(e, s);
                    }
                }),
                s
            );
        }
    };
function ri(r, e, t) {
    for (let n in r) {
        let i = r[n];
        i instanceof Function ? (i = i.bind(e)) : n == 'handleDOMEvents' && (i = ri(i, e, {})), (t[n] = i);
    }
    return t;
}
var We = class {
        constructor(e) {
            (this.spec = e),
                (this.props = {}),
                e.props && ri(e.props, this, this.props),
                (this.key = e.key ? e.key.key : ii('plugin'));
        }
        getState(e) {
            return e[this.key];
        }
    },
    bn = Object.create(null);
function ii(r) {
    return r in bn ? r + '$' + ++bn[r] : ((bn[r] = 0), r + '$');
}
var ft = class {
    constructor(e = 'key') {
        this.key = ii(e);
    }
    get(e) {
        return e.config.pluginsByKey[this.key];
    }
    getState(e) {
        return e[this.key];
    }
};
var A = function (r) {
        for (var e = 0; ; e++) if (((r = r.previousSibling), !r)) return e;
    },
    dt = function (r) {
        let e = r.assignedSlot || r.parentNode;
        return e && e.nodeType == 11 ? e.host : e;
    },
    Dn = null,
    re = function (r, e, t) {
        let n = Dn || (Dn = document.createRange());
        return n.setEnd(r, t ?? r.nodeValue.length), n.setStart(r, e || 0), n;
    },
    So = function () {
        Dn = null;
    },
    Pe = function (r, e, t, n) {
        return t && (si(r, e, t, n, -1) || si(r, e, t, n, 1));
    },
    ko = /^(img|br|input|textarea|hr)$/i;
function si(r, e, t, n, i) {
    for (;;) {
        if (r == t && e == n) return !0;
        if (e == (i < 0 ? 0 : K(r))) {
            let s = r.parentNode;
            if (!s || s.nodeType != 1 || xt(r) || ko.test(r.nodeName) || r.contentEditable == 'false') return !1;
            (e = A(r) + (i < 0 ? 0 : 1)), (r = s);
        } else if (r.nodeType == 1) {
            if (((r = r.childNodes[e + (i < 0 ? -1 : 0)]), r.contentEditable == 'false')) return !1;
            e = i < 0 ? K(r) : 0;
        } else return !1;
    }
}
function K(r) {
    return r.nodeType == 3 ? r.nodeValue.length : r.childNodes.length;
}
function Mo(r, e) {
    for (;;) {
        if (r.nodeType == 3 && e) return r;
        if (r.nodeType == 1 && e > 0) {
            if (r.contentEditable == 'false') return null;
            (r = r.childNodes[e - 1]), (e = K(r));
        } else if (r.parentNode && !xt(r)) (e = A(r)), (r = r.parentNode);
        else return null;
    }
}
function Co(r, e) {
    for (;;) {
        if (r.nodeType == 3 && e < r.nodeValue.length) return r;
        if (r.nodeType == 1 && e < r.childNodes.length) {
            if (r.contentEditable == 'false') return null;
            (r = r.childNodes[e]), (e = 0);
        } else if (r.parentNode && !xt(r)) (e = A(r) + 1), (r = r.parentNode);
        else return null;
    }
}
function Oo(r, e, t) {
    for (let n = e == 0, i = e == K(r); n || i; ) {
        if (r == t) return !0;
        let s = A(r);
        if (((r = r.parentNode), !r)) return !1;
        (n = n && s == 0), (i = i && s == K(r));
    }
}
function xt(r) {
    let e;
    for (let t = r; t && !(e = t.pmViewDesc); t = t.parentNode);
    return e && e.node && e.node.isBlock && (e.dom == r || e.contentDOM == r);
}
var jt = function (r) {
    return r.focusNode && Pe(r.focusNode, r.focusOffset, r.anchorNode, r.anchorOffset);
};
function Te(r, e) {
    let t = document.createEvent('Event');
    return t.initEvent('keydown', !0, !0), (t.keyCode = r), (t.key = t.code = e), t;
}
function No(r) {
    let e = r.activeElement;
    for (; e && e.shadowRoot; ) e = e.shadowRoot.activeElement;
    return e;
}
function wo(r, e, t) {
    if (r.caretPositionFromPoint)
        try {
            let n = r.caretPositionFromPoint(e, t);
            if (n) return { node: n.offsetNode, offset: Math.min(K(n.offsetNode), n.offset) };
        } catch {}
    if (r.caretRangeFromPoint) {
        let n = r.caretRangeFromPoint(e, t);
        if (n) return { node: n.startContainer, offset: Math.min(K(n.startContainer), n.startOffset) };
    }
}
var Z = typeof navigator < 'u' ? navigator : null,
    oi = typeof document < 'u' ? document : null,
    ye = (Z && Z.userAgent) || '',
    Tn = /Edge\/(\d+)/.exec(ye),
    Li = /MSIE \d/.exec(ye),
    En = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(ye),
    J = !!(Li || En || Tn),
    pe = Li ? document.documentMode : En ? +En[1] : Tn ? +Tn[1] : 0,
    G = !J && /gecko\/(\d+)/i.test(ye);
G && +(/Firefox\/(\d+)/.exec(ye) || [0, 0])[1];
var An = !J && /Chrome\/(\d+)/.exec(ye),
    P = !!An,
    Ji = An ? +An[1] : 0,
    F = !J && !!Z && /Apple Computer/.test(Z.vendor),
    je = F && (/Mobile\/\w+/.test(ye) || (!!Z && Z.maxTouchPoints > 2)),
    q = je || (Z ? /Mac/.test(Z.platform) : !1),
    Do = Z ? /Win/.test(Z.platform) : !1,
    U = /Android \d/.test(ye),
    bt = !!oi && 'webkitFontSmoothing' in oi.documentElement.style,
    To = bt ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
function Eo(r) {
    let e = r.defaultView && r.defaultView.visualViewport;
    return e
        ? { left: 0, right: e.width, top: 0, bottom: e.height }
        : { left: 0, right: r.documentElement.clientWidth, top: 0, bottom: r.documentElement.clientHeight };
}
function ne(r, e) {
    return typeof r == 'number' ? r : r[e];
}
function Ao(r) {
    let e = r.getBoundingClientRect(),
        t = e.width / r.offsetWidth || 1,
        n = e.height / r.offsetHeight || 1;
    return { left: e.left, right: e.left + r.clientWidth * t, top: e.top, bottom: e.top + r.clientHeight * n };
}
function li(r, e, t) {
    let n = r.someProp('scrollThreshold') || 0,
        i = r.someProp('scrollMargin') || 5,
        s = r.dom.ownerDocument;
    for (let o = t || r.dom; o; o = dt(o)) {
        if (o.nodeType != 1) continue;
        let l = o,
            a = l == s.body,
            f = a ? Eo(s) : Ao(l),
            c = 0,
            h = 0;
        if (
            (e.top < f.top + ne(n, 'top')
                ? (h = -(f.top - e.top + ne(i, 'top')))
                : e.bottom > f.bottom - ne(n, 'bottom') &&
                  (h =
                      e.bottom - e.top > f.bottom - f.top
                          ? e.top + ne(i, 'top') - f.top
                          : e.bottom - f.bottom + ne(i, 'bottom')),
            e.left < f.left + ne(n, 'left')
                ? (c = -(f.left - e.left + ne(i, 'left')))
                : e.right > f.right - ne(n, 'right') && (c = e.right - f.right + ne(i, 'right')),
            c || h)
        )
            if (a) s.defaultView.scrollBy(c, h);
            else {
                let u = l.scrollLeft,
                    p = l.scrollTop;
                h && (l.scrollTop += h), c && (l.scrollLeft += c);
                let d = l.scrollLeft - u,
                    m = l.scrollTop - p;
                e = { left: e.left - d, top: e.top - m, right: e.right - d, bottom: e.bottom - m };
            }
        if (a || /^(fixed|sticky)$/.test(getComputedStyle(o).position)) break;
    }
}
function Io(r) {
    let e = r.dom.getBoundingClientRect(),
        t = Math.max(0, e.top),
        n,
        i;
    for (let s = (e.left + e.right) / 2, o = t + 1; o < Math.min(innerHeight, e.bottom); o += 5) {
        let l = r.root.elementFromPoint(s, o);
        if (!l || l == r.dom || !r.dom.contains(l)) continue;
        let a = l.getBoundingClientRect();
        if (a.top >= t - 20) {
            (n = l), (i = a.top);
            break;
        }
    }
    return { refDOM: n, refTop: i, stack: Wi(r.dom) };
}
function Wi(r) {
    let e = [],
        t = r.ownerDocument;
    for (let n = r; n && (e.push({ dom: n, top: n.scrollTop, left: n.scrollLeft }), r != t); n = dt(n));
    return e;
}
function Ro({ refDOM: r, refTop: e, stack: t }) {
    let n = r ? r.getBoundingClientRect().top : 0;
    $i(t, n == 0 ? 0 : n - e);
}
function $i(r, e) {
    for (let t = 0; t < r.length; t++) {
        let { dom: n, top: i, left: s } = r[t];
        n.scrollTop != i + e && (n.scrollTop = i + e), n.scrollLeft != s && (n.scrollLeft = s);
    }
}
var $e = null;
function zo(r) {
    if (r.setActive) return r.setActive();
    if ($e) return r.focus($e);
    let e = Wi(r);
    r.focus(
        $e == null
            ? {
                  get preventScroll() {
                      return ($e = { preventScroll: !0 }), !0;
                  },
              }
            : void 0,
    ),
        $e || (($e = !1), $i(e, 0));
}
function qi(r, e) {
    let t,
        n = 2e8,
        i,
        s = 0,
        o = e.top,
        l = e.top,
        a,
        f;
    for (let c = r.firstChild, h = 0; c; c = c.nextSibling, h++) {
        let u;
        if (c.nodeType == 1) u = c.getClientRects();
        else if (c.nodeType == 3) u = re(c).getClientRects();
        else continue;
        for (let p = 0; p < u.length; p++) {
            let d = u[p];
            if (d.top <= o && d.bottom >= l) {
                (o = Math.max(d.bottom, o)), (l = Math.min(d.top, l));
                let m = d.left > e.left ? d.left - e.left : d.right < e.left ? e.left - d.right : 0;
                if (m < n) {
                    (t = c),
                        (n = m),
                        (i = m && t.nodeType == 3 ? { left: d.right < e.left ? d.right : d.left, top: e.top } : e),
                        c.nodeType == 1 && m && (s = h + (e.left >= (d.left + d.right) / 2 ? 1 : 0));
                    continue;
                }
            } else
                d.top > e.top &&
                    !a &&
                    d.left <= e.left &&
                    d.right >= e.left &&
                    ((a = c), (f = { left: Math.max(d.left, Math.min(d.right, e.left)), top: d.top }));
            !t && ((e.left >= d.right && e.top >= d.top) || (e.left >= d.left && e.top >= d.bottom)) && (s = h + 1);
        }
    }
    return (
        !t && a && ((t = a), (i = f), (n = 0)),
        t && t.nodeType == 3 ? Po(t, i) : !t || (n && t.nodeType == 1) ? { node: r, offset: s } : qi(t, i)
    );
}
function Po(r, e) {
    let t = r.nodeValue.length,
        n = document.createRange();
    for (let i = 0; i < t; i++) {
        n.setEnd(r, i + 1), n.setStart(r, i);
        let s = he(n, 1);
        if (s.top != s.bottom && Hn(e, s)) return { node: r, offset: i + (e.left >= (s.left + s.right) / 2 ? 1 : 0) };
    }
    return { node: r, offset: 0 };
}
function Hn(r, e) {
    return r.left >= e.left - 1 && r.left <= e.right + 1 && r.top >= e.top - 1 && r.top <= e.bottom + 1;
}
function Bo(r, e) {
    let t = r.parentNode;
    return t && /^li$/i.test(t.nodeName) && e.left < r.getBoundingClientRect().left ? t : r;
}
function Fo(r, e, t) {
    let { node: n, offset: i } = qi(e, t),
        s = -1;
    if (n.nodeType == 1 && !n.firstChild) {
        let o = n.getBoundingClientRect();
        s = o.left != o.right && t.left > (o.left + o.right) / 2 ? 1 : -1;
    }
    return r.docView.posFromDOM(n, i, s);
}
function vo(r, e, t, n) {
    let i = -1;
    for (let s = e, o = !1; s != r.dom; ) {
        let l = r.docView.nearestDesc(s, !0);
        if (!l) return null;
        if (l.dom.nodeType == 1 && ((l.node.isBlock && l.parent) || !l.contentDOM)) {
            let a = l.dom.getBoundingClientRect();
            if (
                (l.node.isBlock &&
                    l.parent &&
                    ((!o && a.left > n.left) || a.top > n.top
                        ? (i = l.posBefore)
                        : ((!o && a.right < n.left) || a.bottom < n.top) && (i = l.posAfter),
                    (o = !0)),
                !l.contentDOM && i < 0 && !l.node.isText)
            )
                return (l.node.isBlock ? n.top < (a.top + a.bottom) / 2 : n.left < (a.left + a.right) / 2)
                    ? l.posBefore
                    : l.posAfter;
        }
        s = l.dom.parentNode;
    }
    return i > -1 ? i : r.docView.posFromDOM(e, t, -1);
}
function Ki(r, e, t) {
    let n = r.childNodes.length;
    if (n && t.top < t.bottom)
        for (let i = Math.max(0, Math.min(n - 1, Math.floor((n * (e.top - t.top)) / (t.bottom - t.top)) - 2)), s = i; ; ) {
            let o = r.childNodes[s];
            if (o.nodeType == 1) {
                let l = o.getClientRects();
                for (let a = 0; a < l.length; a++) {
                    let f = l[a];
                    if (Hn(e, f)) return Ki(o, e, f);
                }
            }
            if ((s = (s + 1) % n) == i) break;
        }
    return r;
}
function Vo(r, e) {
    let t = r.dom.ownerDocument,
        n,
        i = 0,
        s = wo(t, e.left, e.top);
    s && ({ node: n, offset: i } = s);
    let o = (r.root.elementFromPoint ? r.root : t).elementFromPoint(e.left, e.top),
        l;
    if (!o || !r.dom.contains(o.nodeType != 1 ? o.parentNode : o)) {
        let f = r.dom.getBoundingClientRect();
        if (!Hn(e, f) || ((o = Ki(r.dom, e, f)), !o)) return null;
    }
    if (F) for (let f = o; n && f; f = dt(f)) f.draggable && (n = void 0);
    if (((o = Bo(o, e)), n)) {
        if (G && n.nodeType == 1 && ((i = Math.min(i, n.childNodes.length)), i < n.childNodes.length)) {
            let c = n.childNodes[i],
                h;
            c.nodeName == 'IMG' && (h = c.getBoundingClientRect()).right <= e.left && h.bottom > e.top && i++;
        }
        let f;
        bt &&
            i &&
            n.nodeType == 1 &&
            (f = n.childNodes[i - 1]).nodeType == 1 &&
            f.contentEditable == 'false' &&
            f.getBoundingClientRect().top >= e.top &&
            i--,
            n == r.dom &&
            i == n.childNodes.length - 1 &&
            n.lastChild.nodeType == 1 &&
            e.top > n.lastChild.getBoundingClientRect().bottom
                ? (l = r.state.doc.content.size)
                : (i == 0 || n.nodeType != 1 || n.childNodes[i - 1].nodeName != 'BR') && (l = vo(r, n, i, e));
    }
    l == null && (l = Fo(r, o, e));
    let a = r.docView.nearestDesc(o, !0);
    return { pos: l, inside: a ? a.posAtStart - a.border : -1 };
}
function ai(r) {
    return r.top < r.bottom || r.left < r.right;
}
function he(r, e) {
    let t = r.getClientRects();
    if (t.length) {
        let n = t[e < 0 ? 0 : t.length - 1];
        if (ai(n)) return n;
    }
    return Array.prototype.find.call(t, ai) || r.getBoundingClientRect();
}
var Lo = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function Hi(r, e, t) {
    let { node: n, offset: i, atom: s } = r.docView.domFromPos(e, t < 0 ? -1 : 1),
        o = bt || G;
    if (n.nodeType == 3)
        if (o && (Lo.test(n.nodeValue) || (t < 0 ? !i : i == n.nodeValue.length))) {
            let a = he(re(n, i, i), t);
            if (G && i && /\s/.test(n.nodeValue[i - 1]) && i < n.nodeValue.length) {
                let f = he(re(n, i - 1, i - 1), -1);
                if (f.top == a.top) {
                    let c = he(re(n, i, i + 1), -1);
                    if (c.top != a.top) return ct(c, c.left < f.left);
                }
            }
            return a;
        } else {
            let a = i,
                f = i,
                c = t < 0 ? 1 : -1;
            return (
                t < 0 && !i ? (f++, (c = -1)) : t >= 0 && i == n.nodeValue.length ? (a--, (c = 1)) : t < 0 ? a-- : f++,
                ct(he(re(n, a, f), c), c < 0)
            );
        }
    if (!r.state.doc.resolve(e - (s || 0)).parent.inlineContent) {
        if (s == null && i && (t < 0 || i == K(n))) {
            let a = n.childNodes[i - 1];
            if (a.nodeType == 1) return Mn(a.getBoundingClientRect(), !1);
        }
        if (s == null && i < K(n)) {
            let a = n.childNodes[i];
            if (a.nodeType == 1) return Mn(a.getBoundingClientRect(), !0);
        }
        return Mn(n.getBoundingClientRect(), t >= 0);
    }
    if (s == null && i && (t < 0 || i == K(n))) {
        let a = n.childNodes[i - 1],
            f =
                a.nodeType == 3
                    ? re(a, K(a) - (o ? 0 : 1))
                    : a.nodeType == 1 && (a.nodeName != 'BR' || !a.nextSibling)
                      ? a
                      : null;
        if (f) return ct(he(f, 1), !1);
    }
    if (s == null && i < K(n)) {
        let a = n.childNodes[i];
        for (; a.pmViewDesc && a.pmViewDesc.ignoreForCoords; ) a = a.nextSibling;
        let f = a ? (a.nodeType == 3 ? re(a, 0, o ? 0 : 1) : a.nodeType == 1 ? a : null) : null;
        if (f) return ct(he(f, -1), !0);
    }
    return ct(he(n.nodeType == 3 ? re(n) : n, -t), t >= 0);
}
function ct(r, e) {
    if (r.width == 0) return r;
    let t = e ? r.left : r.right;
    return { top: r.top, bottom: r.bottom, left: t, right: t };
}
function Mn(r, e) {
    if (r.height == 0) return r;
    let t = e ? r.top : r.bottom;
    return { top: t, bottom: t, left: r.left, right: r.right };
}
function ji(r, e, t) {
    let n = r.state,
        i = r.root.activeElement;
    n != e && r.updateState(e), i != r.dom && r.focus();
    try {
        return t();
    } finally {
        n != e && r.updateState(n), i != r.dom && i && i.focus();
    }
}
function Jo(r, e, t) {
    let n = e.selection,
        i = t == 'up' ? n.$from : n.$to;
    return ji(r, e, () => {
        let { node: s } = r.docView.domFromPos(i.pos, t == 'up' ? -1 : 1);
        for (;;) {
            let l = r.docView.nearestDesc(s, !0);
            if (!l) break;
            if (l.node.isBlock) {
                s = l.contentDOM || l.dom;
                break;
            }
            s = l.dom.parentNode;
        }
        let o = Hi(r, i.pos, 1);
        for (let l = s.firstChild; l; l = l.nextSibling) {
            let a;
            if (l.nodeType == 1) a = l.getClientRects();
            else if (l.nodeType == 3) a = re(l, 0, l.nodeValue.length).getClientRects();
            else continue;
            for (let f = 0; f < a.length; f++) {
                let c = a[f];
                if (
                    c.bottom > c.top + 1 &&
                    (t == 'up' ? o.top - c.top > (c.bottom - o.top) * 2 : c.bottom - o.bottom > (o.bottom - c.top) * 2)
                )
                    return !1;
            }
        }
        return !0;
    });
}
var Wo = /[\u0590-\u08ac]/;
function $o(r, e, t) {
    let { $head: n } = e.selection;
    if (!n.parent.isTextblock) return !1;
    let i = n.parentOffset,
        s = !i,
        o = i == n.parent.content.size,
        l = r.domSelection();
    return l
        ? !Wo.test(n.parent.textContent) || !l.modify
            ? t == 'left' || t == 'backward'
                ? s
                : o
            : ji(r, e, () => {
                  let { focusNode: a, focusOffset: f, anchorNode: c, anchorOffset: h } = r.domSelectionRange(),
                      u = l.caretBidiLevel;
                  l.modify('move', t, 'character');
                  let p = n.depth ? r.docView.domAfterPos(n.before()) : r.dom,
                      { focusNode: d, focusOffset: m } = r.domSelectionRange(),
                      g = (d && !p.contains(d.nodeType == 1 ? d : d.parentNode)) || (a == d && f == m);
                  try {
                      l.collapse(c, h), a && (a != c || f != h) && l.extend && l.extend(a, f);
                  } catch {}
                  return u != null && (l.caretBidiLevel = u), g;
              })
        : n.pos == n.start() || n.pos == n.end();
}
var fi = null,
    ci = null,
    hi = !1;
function qo(r, e, t) {
    return fi == e && ci == t ? hi : ((fi = e), (ci = t), (hi = t == 'up' || t == 'down' ? Jo(r, e, t) : $o(r, e, t)));
}
var H = 0,
    ui = 1,
    Ee = 2,
    Q = 3,
    Be = class {
        constructor(e, t, n, i) {
            (this.parent = e),
                (this.children = t),
                (this.dom = n),
                (this.contentDOM = i),
                (this.dirty = H),
                (n.pmViewDesc = this);
        }
        matchesWidget(e) {
            return !1;
        }
        matchesMark(e) {
            return !1;
        }
        matchesNode(e, t, n) {
            return !1;
        }
        matchesHack(e) {
            return !1;
        }
        parseRule() {
            return null;
        }
        stopEvent(e) {
            return !1;
        }
        get size() {
            let e = 0;
            for (let t = 0; t < this.children.length; t++) e += this.children[t].size;
            return e;
        }
        get border() {
            return 0;
        }
        destroy() {
            (this.parent = void 0), this.dom.pmViewDesc == this && (this.dom.pmViewDesc = void 0);
            for (let e = 0; e < this.children.length; e++) this.children[e].destroy();
        }
        posBeforeChild(e) {
            for (let t = 0, n = this.posAtStart; ; t++) {
                let i = this.children[t];
                if (i == e) return n;
                n += i.size;
            }
        }
        get posBefore() {
            return this.parent.posBeforeChild(this);
        }
        get posAtStart() {
            return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
        }
        get posAfter() {
            return this.posBefore + this.size;
        }
        get posAtEnd() {
            return this.posAtStart + this.size - 2 * this.border;
        }
        localPosFromDOM(e, t, n) {
            if (this.contentDOM && this.contentDOM.contains(e.nodeType == 1 ? e : e.parentNode))
                if (n < 0) {
                    let s, o;
                    if (e == this.contentDOM) s = e.childNodes[t - 1];
                    else {
                        for (; e.parentNode != this.contentDOM; ) e = e.parentNode;
                        s = e.previousSibling;
                    }
                    for (; s && !((o = s.pmViewDesc) && o.parent == this); ) s = s.previousSibling;
                    return s ? this.posBeforeChild(o) + o.size : this.posAtStart;
                } else {
                    let s, o;
                    if (e == this.contentDOM) s = e.childNodes[t];
                    else {
                        for (; e.parentNode != this.contentDOM; ) e = e.parentNode;
                        s = e.nextSibling;
                    }
                    for (; s && !((o = s.pmViewDesc) && o.parent == this); ) s = s.nextSibling;
                    return s ? this.posBeforeChild(o) : this.posAtEnd;
                }
            let i;
            if (e == this.dom && this.contentDOM) i = t > A(this.contentDOM);
            else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM))
                i = e.compareDocumentPosition(this.contentDOM) & 2;
            else if (this.dom.firstChild) {
                if (t == 0)
                    for (let s = e; ; s = s.parentNode) {
                        if (s == this.dom) {
                            i = !1;
                            break;
                        }
                        if (s.previousSibling) break;
                    }
                if (i == null && t == e.childNodes.length)
                    for (let s = e; ; s = s.parentNode) {
                        if (s == this.dom) {
                            i = !0;
                            break;
                        }
                        if (s.nextSibling) break;
                    }
            }
            return (i ?? n > 0) ? this.posAtEnd : this.posAtStart;
        }
        nearestDesc(e, t = !1) {
            for (let n = !0, i = e; i; i = i.parentNode) {
                let s = this.getDesc(i),
                    o;
                if (s && (!t || s.node))
                    if (n && (o = s.nodeDOM) && !(o.nodeType == 1 ? o.contains(e.nodeType == 1 ? e : e.parentNode) : o == e))
                        n = !1;
                    else return s;
            }
        }
        getDesc(e) {
            let t = e.pmViewDesc;
            for (let n = t; n; n = n.parent) if (n == this) return t;
        }
        posFromDOM(e, t, n) {
            for (let i = e; i; i = i.parentNode) {
                let s = this.getDesc(i);
                if (s) return s.localPosFromDOM(e, t, n);
            }
            return -1;
        }
        descAt(e) {
            for (let t = 0, n = 0; t < this.children.length; t++) {
                let i = this.children[t],
                    s = n + i.size;
                if (n == e && s != n) {
                    for (; !i.border && i.children.length; ) i = i.children[0];
                    return i;
                }
                if (e < s) return i.descAt(e - n - i.border);
                n = s;
            }
        }
        domFromPos(e, t) {
            if (!this.contentDOM) return { node: this.dom, offset: 0, atom: e + 1 };
            let n = 0,
                i = 0;
            for (let s = 0; n < this.children.length; n++) {
                let o = this.children[n],
                    l = s + o.size;
                if (l > e || o instanceof Lt) {
                    i = e - s;
                    break;
                }
                s = l;
            }
            if (i) return this.children[n].domFromPos(i - this.children[n].border, t);
            for (let s; n && !(s = this.children[n - 1]).size && s instanceof vt && s.side >= 0; n--);
            if (t <= 0) {
                let s,
                    o = !0;
                for (; (s = n ? this.children[n - 1] : null), !(!s || s.dom.parentNode == this.contentDOM); n--, o = !1);
                return s && t && o && !s.border && !s.domAtom
                    ? s.domFromPos(s.size, t)
                    : { node: this.contentDOM, offset: s ? A(s.dom) + 1 : 0 };
            } else {
                let s,
                    o = !0;
                for (
                    ;
                    (s = n < this.children.length ? this.children[n] : null), !(!s || s.dom.parentNode == this.contentDOM);
                    n++, o = !1
                );
                return s && o && !s.border && !s.domAtom
                    ? s.domFromPos(0, t)
                    : { node: this.contentDOM, offset: s ? A(s.dom) : this.contentDOM.childNodes.length };
            }
        }
        parseRange(e, t, n = 0) {
            if (this.children.length == 0)
                return { node: this.contentDOM, from: e, to: t, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
            let i = -1,
                s = -1;
            for (let o = n, l = 0; ; l++) {
                let a = this.children[l],
                    f = o + a.size;
                if (i == -1 && e <= f) {
                    let c = o + a.border;
                    if (e >= c && t <= f - a.border && a.node && a.contentDOM && this.contentDOM.contains(a.contentDOM))
                        return a.parseRange(e, t, c);
                    e = o;
                    for (let h = l; h > 0; h--) {
                        let u = this.children[h - 1];
                        if (u.size && u.dom.parentNode == this.contentDOM && !u.emptyChildAt(1)) {
                            i = A(u.dom) + 1;
                            break;
                        }
                        e -= u.size;
                    }
                    i == -1 && (i = 0);
                }
                if (i > -1 && (f > t || l == this.children.length - 1)) {
                    t = f;
                    for (let c = l + 1; c < this.children.length; c++) {
                        let h = this.children[c];
                        if (h.size && h.dom.parentNode == this.contentDOM && !h.emptyChildAt(-1)) {
                            s = A(h.dom);
                            break;
                        }
                        t += h.size;
                    }
                    s == -1 && (s = this.contentDOM.childNodes.length);
                    break;
                }
                o = f;
            }
            return { node: this.contentDOM, from: e, to: t, fromOffset: i, toOffset: s };
        }
        emptyChildAt(e) {
            if (this.border || !this.contentDOM || !this.children.length) return !1;
            let t = this.children[e < 0 ? 0 : this.children.length - 1];
            return t.size == 0 || t.emptyChildAt(e);
        }
        domAfterPos(e) {
            let { node: t, offset: n } = this.domFromPos(e, 0);
            if (t.nodeType != 1 || n == t.childNodes.length) throw new RangeError('No node after pos ' + e);
            return t.childNodes[n];
        }
        setSelection(e, t, n, i = !1) {
            let s = Math.min(e, t),
                o = Math.max(e, t);
            for (let p = 0, d = 0; p < this.children.length; p++) {
                let m = this.children[p],
                    g = d + m.size;
                if (s > d && o < g) return m.setSelection(e - d - m.border, t - d - m.border, n, i);
                d = g;
            }
            let l = this.domFromPos(e, e ? -1 : 1),
                a = t == e ? l : this.domFromPos(t, t ? -1 : 1),
                f = n.root.getSelection(),
                c = n.domSelectionRange(),
                h = !1;
            if ((G || F) && e == t) {
                let { node: p, offset: d } = l;
                if (p.nodeType == 3) {
                    if (
                        ((h = !!(
                            d &&
                            p.nodeValue[d - 1] ==
                                `
`
                        )),
                        h && d == p.nodeValue.length)
                    )
                        for (let m = p, g; m; m = m.parentNode) {
                            if ((g = m.nextSibling)) {
                                g.nodeName == 'BR' && (l = a = { node: g.parentNode, offset: A(g) + 1 });
                                break;
                            }
                            let b = m.pmViewDesc;
                            if (b && b.node && b.node.isBlock) break;
                        }
                } else {
                    let m = p.childNodes[d - 1];
                    h = m && (m.nodeName == 'BR' || m.contentEditable == 'false');
                }
            }
            if (G && c.focusNode && c.focusNode != a.node && c.focusNode.nodeType == 1) {
                let p = c.focusNode.childNodes[c.focusOffset];
                p && p.contentEditable == 'false' && (i = !0);
            }
            if (
                !(i || (h && F)) &&
                Pe(l.node, l.offset, c.anchorNode, c.anchorOffset) &&
                Pe(a.node, a.offset, c.focusNode, c.focusOffset)
            )
                return;
            let u = !1;
            if ((f.extend || e == t) && !h) {
                f.collapse(l.node, l.offset);
                try {
                    e != t && f.extend(a.node, a.offset), (u = !0);
                } catch {}
            }
            if (!u) {
                if (e > t) {
                    let d = l;
                    (l = a), (a = d);
                }
                let p = document.createRange();
                p.setEnd(a.node, a.offset), p.setStart(l.node, l.offset), f.removeAllRanges(), f.addRange(p);
            }
        }
        ignoreMutation(e) {
            return !this.contentDOM && e.type != 'selection';
        }
        get contentLost() {
            return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
        }
        markDirty(e, t) {
            for (let n = 0, i = 0; i < this.children.length; i++) {
                let s = this.children[i],
                    o = n + s.size;
                if (n == o ? e <= o && t >= n : e < o && t > n) {
                    let l = n + s.border,
                        a = o - s.border;
                    if (e >= l && t <= a) {
                        (this.dirty = e == n || t == o ? Ee : ui),
                            e == l && t == a && (s.contentLost || s.dom.parentNode != this.contentDOM)
                                ? (s.dirty = Q)
                                : s.markDirty(e - l, t - l);
                        return;
                    } else
                        s.dirty = s.dom == s.contentDOM && s.dom.parentNode == this.contentDOM && !s.children.length ? Ee : Q;
                }
                n = o;
            }
            this.dirty = Ee;
        }
        markParentsDirty() {
            let e = 1;
            for (let t = this.parent; t; t = t.parent, e++) {
                let n = e == 1 ? Ee : ui;
                t.dirty < n && (t.dirty = n);
            }
        }
        get domAtom() {
            return !1;
        }
        get ignoreForCoords() {
            return !1;
        }
        isText(e) {
            return !1;
        }
    },
    vt = class extends Be {
        constructor(e, t, n, i) {
            let s,
                o = t.type.toDOM;
            if (
                (typeof o == 'function' &&
                    (o = o(n, () => {
                        if (!s) return i;
                        if (s.parent) return s.parent.posBeforeChild(s);
                    })),
                !t.type.spec.raw)
            ) {
                if (o.nodeType != 1) {
                    let l = document.createElement('span');
                    l.appendChild(o), (o = l);
                }
                (o.contentEditable = 'false'), o.classList.add('ProseMirror-widget');
            }
            super(e, [], o, null), (this.widget = t), (this.widget = t), (s = this);
        }
        matchesWidget(e) {
            return this.dirty == H && e.type.eq(this.widget.type);
        }
        parseRule() {
            return { ignore: !0 };
        }
        stopEvent(e) {
            let t = this.widget.spec.stopEvent;
            return t ? t(e) : !1;
        }
        ignoreMutation(e) {
            return e.type != 'selection' || this.widget.spec.ignoreSelection;
        }
        destroy() {
            this.widget.type.destroy(this.dom), super.destroy();
        }
        get domAtom() {
            return !0;
        }
        get side() {
            return this.widget.type.side;
        }
    },
    In = class extends Be {
        constructor(e, t, n, i) {
            super(e, [], t, null), (this.textDOM = n), (this.text = i);
        }
        get size() {
            return this.text.length;
        }
        localPosFromDOM(e, t) {
            return e != this.textDOM ? this.posAtStart + (t ? this.size : 0) : this.posAtStart + t;
        }
        domFromPos(e) {
            return { node: this.textDOM, offset: e };
        }
        ignoreMutation(e) {
            return e.type === 'characterData' && e.target.nodeValue == e.oldValue;
        }
    },
    Ue = class r extends Be {
        constructor(e, t, n, i, s) {
            super(e, [], n, i), (this.mark = t), (this.spec = s);
        }
        static create(e, t, n, i) {
            let s = i.nodeViews[t.type.name],
                o = s && s(t, i, n);
            return (
                (!o || !o.dom) && (o = Oe.renderSpec(document, t.type.spec.toDOM(t, n), null, t.attrs)),
                new r(e, t, o.dom, o.contentDOM || o.dom, o)
            );
        }
        parseRule() {
            return this.dirty & Q || this.mark.type.spec.reparseInView
                ? null
                : { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM };
        }
        matchesMark(e) {
            return this.dirty != Q && this.mark.eq(e);
        }
        markDirty(e, t) {
            if ((super.markDirty(e, t), this.dirty != H)) {
                let n = this.parent;
                for (; !n.node; ) n = n.parent;
                n.dirty < this.dirty && (n.dirty = this.dirty), (this.dirty = H);
            }
        }
        slice(e, t, n) {
            let i = r.create(this.parent, this.mark, !0, n),
                s = this.children,
                o = this.size;
            t < o && (s = Bn(s, t, o, n)), e > 0 && (s = Bn(s, 0, e, n));
            for (let l = 0; l < s.length; l++) s[l].parent = i;
            return (i.children = s), i;
        }
        ignoreMutation(e) {
            return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
        }
        destroy() {
            this.spec.destroy && this.spec.destroy(), super.destroy();
        }
    },
    me = class r extends Be {
        constructor(e, t, n, i, s, o, l, a, f) {
            super(e, [], s, o), (this.node = t), (this.outerDeco = n), (this.innerDeco = i), (this.nodeDOM = l);
        }
        static create(e, t, n, i, s, o) {
            let l = s.nodeViews[t.type.name],
                a,
                f =
                    l &&
                    l(
                        t,
                        s,
                        () => {
                            if (!a) return o;
                            if (a.parent) return a.parent.posBeforeChild(a);
                        },
                        n,
                        i,
                    ),
                c = f && f.dom,
                h = f && f.contentDOM;
            if (t.isText) {
                if (!c) c = document.createTextNode(t.text);
                else if (c.nodeType != 3) throw new RangeError('Text must be rendered as a DOM text node');
            } else c || ({ dom: c, contentDOM: h } = Oe.renderSpec(document, t.type.spec.toDOM(t), null, t.attrs));
            !h &&
                !t.isText &&
                c.nodeName != 'BR' &&
                (c.hasAttribute('contenteditable') || (c.contentEditable = 'false'),
                t.type.spec.draggable && (c.draggable = !0));
            let u = c;
            return (
                (c = Yi(c, n, t)),
                f
                    ? (a = new Rn(e, t, n, i, c, h || null, u, f, s, o + 1))
                    : t.isText
                      ? new Vt(e, t, n, i, c, u, s)
                      : new r(e, t, n, i, c, h || null, u, s, o + 1)
            );
        }
        parseRule() {
            if (this.node.type.spec.reparseInView) return null;
            let e = { node: this.node.type.name, attrs: this.node.attrs };
            if ((this.node.type.whitespace == 'pre' && (e.preserveWhitespace = 'full'), !this.contentDOM))
                e.getContent = () => this.node.content;
            else if (!this.contentLost) e.contentElement = this.contentDOM;
            else {
                for (let t = this.children.length - 1; t >= 0; t--) {
                    let n = this.children[t];
                    if (this.dom.contains(n.dom.parentNode)) {
                        e.contentElement = n.dom.parentNode;
                        break;
                    }
                }
                e.contentElement || (e.getContent = () => y.empty);
            }
            return e;
        }
        matchesNode(e, t, n) {
            return this.dirty == H && e.eq(this.node) && Jt(t, this.outerDeco) && n.eq(this.innerDeco);
        }
        get size() {
            return this.node.nodeSize;
        }
        get border() {
            return this.node.isLeaf ? 0 : 1;
        }
        updateChildren(e, t) {
            let n = this.node.inlineContent,
                i = t,
                s = e.composing ? this.localCompositionInfo(e, t) : null,
                o = s && s.pos > -1 ? s : null,
                l = s && s.pos < 0,
                a = new Pn(this, o && o.node, e);
            Uo(
                this.node,
                this.innerDeco,
                (f, c, h) => {
                    f.spec.marks
                        ? a.syncToMarks(f.spec.marks, n, e)
                        : f.type.side >= 0 &&
                          !h &&
                          a.syncToMarks(c == this.node.childCount ? C.none : this.node.child(c).marks, n, e),
                        a.placeWidget(f, e, i);
                },
                (f, c, h, u) => {
                    a.syncToMarks(f.marks, n, e);
                    let p;
                    a.findNodeMatch(f, c, h, u) ||
                        (l &&
                            e.state.selection.from > i &&
                            e.state.selection.to < i + f.nodeSize &&
                            (p = a.findIndexWithChild(s.node)) > -1 &&
                            a.updateNodeAt(f, c, h, p, e)) ||
                        a.updateNextNode(f, c, h, e, u, i) ||
                        a.addNode(f, c, h, e, i),
                        (i += f.nodeSize);
                },
            ),
                a.syncToMarks([], n, e),
                this.node.isTextblock && a.addTextblockHacks(),
                a.destroyRest(),
                (a.changed || this.dirty == Ee) &&
                    (o && this.protectLocalComposition(e, o), Ui(this.contentDOM, this.children, e), je && Go(this.dom));
        }
        localCompositionInfo(e, t) {
            let { from: n, to: i } = e.state.selection;
            if (!(e.state.selection instanceof O) || n < t || i > t + this.node.content.size) return null;
            let s = e.input.compositionNode;
            if (!s || !this.dom.contains(s.parentNode)) return null;
            if (this.node.inlineContent) {
                let o = s.nodeValue,
                    l = Yo(this.node.content, o, n - t, i - t);
                return l < 0 ? null : { node: s, pos: l, text: o };
            } else return { node: s, pos: -1, text: '' };
        }
        protectLocalComposition(e, { node: t, pos: n, text: i }) {
            if (this.getDesc(t)) return;
            let s = t;
            for (; s.parentNode != this.contentDOM; s = s.parentNode) {
                for (; s.previousSibling; ) s.parentNode.removeChild(s.previousSibling);
                for (; s.nextSibling; ) s.parentNode.removeChild(s.nextSibling);
                s.pmViewDesc && (s.pmViewDesc = void 0);
            }
            let o = new In(this, s, t, i);
            e.input.compositionNodes.push(o), (this.children = Bn(this.children, n, n + i.length, e, o));
        }
        update(e, t, n, i) {
            return this.dirty == Q || !e.sameMarkup(this.node) ? !1 : (this.updateInner(e, t, n, i), !0);
        }
        updateInner(e, t, n, i) {
            this.updateOuterDeco(t),
                (this.node = e),
                (this.innerDeco = n),
                this.contentDOM && this.updateChildren(i, this.posAtStart),
                (this.dirty = H);
        }
        updateOuterDeco(e) {
            if (Jt(e, this.outerDeco)) return;
            let t = this.nodeDOM.nodeType != 1,
                n = this.dom;
            (this.dom = Gi(this.dom, this.nodeDOM, zn(this.outerDeco, this.node, t), zn(e, this.node, t))),
                this.dom != n && ((n.pmViewDesc = void 0), (this.dom.pmViewDesc = this)),
                (this.outerDeco = e);
        }
        selectNode() {
            this.nodeDOM.nodeType == 1 && this.nodeDOM.classList.add('ProseMirror-selectednode'),
                (this.contentDOM || !this.node.type.spec.draggable) && (this.dom.draggable = !0);
        }
        deselectNode() {
            this.nodeDOM.nodeType == 1 &&
                (this.nodeDOM.classList.remove('ProseMirror-selectednode'),
                (this.contentDOM || !this.node.type.spec.draggable) && this.dom.removeAttribute('draggable'));
        }
        get domAtom() {
            return this.node.isAtom;
        }
    };
function di(r, e, t, n, i) {
    Yi(n, e, r);
    let s = new me(void 0, r, e, t, n, n, n, i, 0);
    return s.contentDOM && s.updateChildren(i, 0), s;
}
var Vt = class r extends me {
        constructor(e, t, n, i, s, o, l) {
            super(e, t, n, i, s, null, o, l, 0);
        }
        parseRule() {
            let e = this.nodeDOM.parentNode;
            for (; e && e != this.dom && !e.pmIsDeco; ) e = e.parentNode;
            return { skip: e || !0 };
        }
        update(e, t, n, i) {
            return this.dirty == Q || (this.dirty != H && !this.inParent()) || !e.sameMarkup(this.node)
                ? !1
                : (this.updateOuterDeco(t),
                  (this.dirty != H || e.text != this.node.text) &&
                      e.text != this.nodeDOM.nodeValue &&
                      ((this.nodeDOM.nodeValue = e.text), i.trackWrites == this.nodeDOM && (i.trackWrites = null)),
                  (this.node = e),
                  (this.dirty = H),
                  !0);
        }
        inParent() {
            let e = this.parent.contentDOM;
            for (let t = this.nodeDOM; t; t = t.parentNode) if (t == e) return !0;
            return !1;
        }
        domFromPos(e) {
            return { node: this.nodeDOM, offset: e };
        }
        localPosFromDOM(e, t, n) {
            return e == this.nodeDOM ? this.posAtStart + Math.min(t, this.node.text.length) : super.localPosFromDOM(e, t, n);
        }
        ignoreMutation(e) {
            return e.type != 'characterData' && e.type != 'selection';
        }
        slice(e, t, n) {
            let i = this.node.cut(e, t),
                s = document.createTextNode(i.text);
            return new r(this.parent, i, this.outerDeco, this.innerDeco, s, s, n);
        }
        markDirty(e, t) {
            super.markDirty(e, t),
                this.dom != this.nodeDOM && (e == 0 || t == this.nodeDOM.nodeValue.length) && (this.dirty = Q);
        }
        get domAtom() {
            return !1;
        }
        isText(e) {
            return this.node.text == e;
        }
    },
    Lt = class extends Be {
        parseRule() {
            return { ignore: !0 };
        }
        matchesHack(e) {
            return this.dirty == H && this.dom.nodeName == e;
        }
        get domAtom() {
            return !0;
        }
        get ignoreForCoords() {
            return this.dom.nodeName == 'IMG';
        }
    },
    Rn = class extends me {
        constructor(e, t, n, i, s, o, l, a, f, c) {
            super(e, t, n, i, s, o, l, f, c), (this.spec = a);
        }
        update(e, t, n, i) {
            if (this.dirty == Q) return !1;
            if (this.spec.update && (this.node.type == e.type || this.spec.multiType)) {
                let s = this.spec.update(e, t, n);
                return s && this.updateInner(e, t, n, i), s;
            } else return !this.contentDOM && !e.isLeaf ? !1 : super.update(e, t, n, i);
        }
        selectNode() {
            this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
        }
        deselectNode() {
            this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
        }
        setSelection(e, t, n, i) {
            this.spec.setSelection ? this.spec.setSelection(e, t, n.root) : super.setSelection(e, t, n, i);
        }
        destroy() {
            this.spec.destroy && this.spec.destroy(), super.destroy();
        }
        stopEvent(e) {
            return this.spec.stopEvent ? this.spec.stopEvent(e) : !1;
        }
        ignoreMutation(e) {
            return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
        }
    };
function Ui(r, e, t) {
    let n = r.firstChild,
        i = !1;
    for (let s = 0; s < e.length; s++) {
        let o = e[s],
            l = o.dom;
        if (l.parentNode == r) {
            for (; l != n; ) (n = pi(n)), (i = !0);
            n = n.nextSibling;
        } else (i = !0), r.insertBefore(l, n);
        if (o instanceof Ue) {
            let a = n ? n.previousSibling : r.lastChild;
            Ui(o.contentDOM, o.children, t), (n = a ? a.nextSibling : r.firstChild);
        }
    }
    for (; n; ) (n = pi(n)), (i = !0);
    i && t.trackWrites == r && (t.trackWrites = null);
}
var ht = function (r) {
    r && (this.nodeName = r);
};
ht.prototype = Object.create(null);
var Ae = [new ht()];
function zn(r, e, t) {
    if (r.length == 0) return Ae;
    let n = t ? Ae[0] : new ht(),
        i = [n];
    for (let s = 0; s < r.length; s++) {
        let o = r[s].type.attrs;
        if (o) {
            o.nodeName && i.push((n = new ht(o.nodeName)));
            for (let l in o) {
                let a = o[l];
                a != null &&
                    (t && i.length == 1 && i.push((n = new ht(e.isInline ? 'span' : 'div'))),
                    l == 'class'
                        ? (n.class = (n.class ? n.class + ' ' : '') + a)
                        : l == 'style'
                          ? (n.style = (n.style ? n.style + ';' : '') + a)
                          : l != 'nodeName' && (n[l] = a));
            }
        }
    }
    return i;
}
function Gi(r, e, t, n) {
    if (t == Ae && n == Ae) return e;
    let i = e;
    for (let s = 0; s < n.length; s++) {
        let o = n[s],
            l = t[s];
        if (s) {
            let a;
            (l && l.nodeName == o.nodeName && i != r && (a = i.parentNode) && a.nodeName.toLowerCase() == o.nodeName) ||
                ((a = document.createElement(o.nodeName)), (a.pmIsDeco = !0), a.appendChild(i), (l = Ae[0])),
                (i = a);
        }
        Ko(i, l || Ae[0], o);
    }
    return i;
}
function Ko(r, e, t) {
    for (let n in e) n != 'class' && n != 'style' && n != 'nodeName' && !(n in t) && r.removeAttribute(n);
    for (let n in t) n != 'class' && n != 'style' && n != 'nodeName' && t[n] != e[n] && r.setAttribute(n, t[n]);
    if (e.class != t.class) {
        let n = e.class ? e.class.split(' ').filter(Boolean) : [],
            i = t.class ? t.class.split(' ').filter(Boolean) : [];
        for (let s = 0; s < n.length; s++) i.indexOf(n[s]) == -1 && r.classList.remove(n[s]);
        for (let s = 0; s < i.length; s++) n.indexOf(i[s]) == -1 && r.classList.add(i[s]);
        r.classList.length == 0 && r.removeAttribute('class');
    }
    if (e.style != t.style) {
        if (e.style) {
            let n = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g,
                i;
            for (; (i = n.exec(e.style)); ) r.style.removeProperty(i[1]);
        }
        t.style && (r.style.cssText += t.style);
    }
}
function Yi(r, e, t) {
    return Gi(r, r, Ae, zn(e, t, r.nodeType != 1));
}
function Jt(r, e) {
    if (r.length != e.length) return !1;
    for (let t = 0; t < r.length; t++) if (!r[t].type.eq(e[t].type)) return !1;
    return !0;
}
function pi(r) {
    let e = r.nextSibling;
    return r.parentNode.removeChild(r), e;
}
var Pn = class {
    constructor(e, t, n) {
        (this.lock = t),
            (this.view = n),
            (this.index = 0),
            (this.stack = []),
            (this.changed = !1),
            (this.top = e),
            (this.preMatch = Ho(e.node.content, e));
    }
    destroyBetween(e, t) {
        if (e != t) {
            for (let n = e; n < t; n++) this.top.children[n].destroy();
            this.top.children.splice(e, t - e), (this.changed = !0);
        }
    }
    destroyRest() {
        this.destroyBetween(this.index, this.top.children.length);
    }
    syncToMarks(e, t, n) {
        let i = 0,
            s = this.stack.length >> 1,
            o = Math.min(s, e.length);
        for (
            ;
            i < o && (i == s - 1 ? this.top : this.stack[(i + 1) << 1]).matchesMark(e[i]) && e[i].type.spec.spanning !== !1;

        )
            i++;
        for (; i < s; )
            this.destroyRest(), (this.top.dirty = H), (this.index = this.stack.pop()), (this.top = this.stack.pop()), s--;
        for (; s < e.length; ) {
            this.stack.push(this.top, this.index + 1);
            let l = -1;
            for (let a = this.index; a < Math.min(this.index + 3, this.top.children.length); a++) {
                let f = this.top.children[a];
                if (f.matchesMark(e[s]) && !this.isLocked(f.dom)) {
                    l = a;
                    break;
                }
            }
            if (l > -1)
                l > this.index && ((this.changed = !0), this.destroyBetween(this.index, l)),
                    (this.top = this.top.children[this.index]);
            else {
                let a = Ue.create(this.top, e[s], t, n);
                this.top.children.splice(this.index, 0, a), (this.top = a), (this.changed = !0);
            }
            (this.index = 0), s++;
        }
    }
    findNodeMatch(e, t, n, i) {
        let s = -1,
            o;
        if (
            i >= this.preMatch.index &&
            (o = this.preMatch.matches[i - this.preMatch.index]).parent == this.top &&
            o.matchesNode(e, t, n)
        )
            s = this.top.children.indexOf(o, this.index);
        else
            for (let l = this.index, a = Math.min(this.top.children.length, l + 5); l < a; l++) {
                let f = this.top.children[l];
                if (f.matchesNode(e, t, n) && !this.preMatch.matched.has(f)) {
                    s = l;
                    break;
                }
            }
        return s < 0 ? !1 : (this.destroyBetween(this.index, s), this.index++, !0);
    }
    updateNodeAt(e, t, n, i, s) {
        let o = this.top.children[i];
        return (
            o.dirty == Q && o.dom == o.contentDOM && (o.dirty = Ee),
            o.update(e, t, n, s) ? (this.destroyBetween(this.index, i), this.index++, !0) : !1
        );
    }
    findIndexWithChild(e) {
        for (;;) {
            let t = e.parentNode;
            if (!t) return -1;
            if (t == this.top.contentDOM) {
                let n = e.pmViewDesc;
                if (n) {
                    for (let i = this.index; i < this.top.children.length; i++) if (this.top.children[i] == n) return i;
                }
                return -1;
            }
            e = t;
        }
    }
    updateNextNode(e, t, n, i, s, o) {
        for (let l = this.index; l < this.top.children.length; l++) {
            let a = this.top.children[l];
            if (a instanceof me) {
                let f = this.preMatch.matched.get(a);
                if (f != null && f != s) return !1;
                let c = a.dom,
                    h,
                    u =
                        this.isLocked(c) &&
                        !(
                            e.isText &&
                            a.node &&
                            a.node.isText &&
                            a.nodeDOM.nodeValue == e.text &&
                            a.dirty != Q &&
                            Jt(t, a.outerDeco)
                        );
                if (!u && a.update(e, t, n, i))
                    return this.destroyBetween(this.index, l), a.dom != c && (this.changed = !0), this.index++, !0;
                if (!u && (h = this.recreateWrapper(a, e, t, n, i, o)))
                    return (
                        this.destroyBetween(this.index, l),
                        (this.top.children[this.index] = h),
                        h.contentDOM && ((h.dirty = Ee), h.updateChildren(i, o + 1), (h.dirty = H)),
                        (this.changed = !0),
                        this.index++,
                        !0
                    );
                break;
            }
        }
        return !1;
    }
    recreateWrapper(e, t, n, i, s, o) {
        if (
            e.dirty ||
            t.isAtom ||
            !e.children.length ||
            !e.node.content.eq(t.content) ||
            !Jt(n, e.outerDeco) ||
            !i.eq(e.innerDeco)
        )
            return null;
        let l = me.create(this.top, t, n, i, s, o);
        if (l.contentDOM) {
            (l.children = e.children), (e.children = []);
            for (let a of l.children) a.parent = l;
        }
        return e.destroy(), l;
    }
    addNode(e, t, n, i, s) {
        let o = me.create(this.top, e, t, n, i, s);
        o.contentDOM && o.updateChildren(i, s + 1), this.top.children.splice(this.index++, 0, o), (this.changed = !0);
    }
    placeWidget(e, t, n) {
        let i = this.index < this.top.children.length ? this.top.children[this.index] : null;
        if (i && i.matchesWidget(e) && (e == i.widget || !i.widget.type.toDOM.parentNode)) this.index++;
        else {
            let s = new vt(this.top, e, t, n);
            this.top.children.splice(this.index++, 0, s), (this.changed = !0);
        }
    }
    addTextblockHacks() {
        let e = this.top.children[this.index - 1],
            t = this.top;
        for (; e instanceof Ue; ) (t = e), (e = t.children[t.children.length - 1]);
        (!e || !(e instanceof Vt) || /\n$/.test(e.node.text) || (this.view.requiresGeckoHackNode && /\s$/.test(e.node.text))) &&
            ((F || P) && e && e.dom.contentEditable == 'false' && this.addHackNode('IMG', t), this.addHackNode('BR', this.top));
    }
    addHackNode(e, t) {
        if (t == this.top && this.index < t.children.length && t.children[this.index].matchesHack(e)) this.index++;
        else {
            let n = document.createElement(e);
            e == 'IMG' && ((n.className = 'ProseMirror-separator'), (n.alt = '')),
                e == 'BR' && (n.className = 'ProseMirror-trailingBreak');
            let i = new Lt(this.top, [], n, null);
            t != this.top ? t.children.push(i) : t.children.splice(this.index++, 0, i), (this.changed = !0);
        }
    }
    isLocked(e) {
        return this.lock && (e == this.lock || (e.nodeType == 1 && e.contains(this.lock.parentNode)));
    }
};
function Ho(r, e) {
    let t = e,
        n = t.children.length,
        i = r.childCount,
        s = new Map(),
        o = [];
    e: for (; i > 0; ) {
        let l;
        for (;;)
            if (n) {
                let f = t.children[n - 1];
                if (f instanceof Ue) (t = f), (n = f.children.length);
                else {
                    (l = f), n--;
                    break;
                }
            } else {
                if (t == e) break e;
                (n = t.parent.children.indexOf(t)), (t = t.parent);
            }
        let a = l.node;
        if (a) {
            if (a != r.child(i - 1)) break;
            --i, s.set(l, i), o.push(l);
        }
    }
    return { index: i, matched: s, matches: o.reverse() };
}
function jo(r, e) {
    return r.type.side - e.type.side;
}
function Uo(r, e, t, n) {
    let i = e.locals(r),
        s = 0;
    if (i.length == 0) {
        for (let f = 0; f < r.childCount; f++) {
            let c = r.child(f);
            n(c, i, e.forChild(s, c), f), (s += c.nodeSize);
        }
        return;
    }
    let o = 0,
        l = [],
        a = null;
    for (let f = 0; ; ) {
        let c, h;
        for (; o < i.length && i[o].to == s; ) {
            let g = i[o++];
            g.widget && (c ? (h || (h = [c])).push(g) : (c = g));
        }
        if (c)
            if (h) {
                h.sort(jo);
                for (let g = 0; g < h.length; g++) t(h[g], f, !!a);
            } else t(c, f, !!a);
        let u, p;
        if (a) (p = -1), (u = a), (a = null);
        else if (f < r.childCount) (p = f), (u = r.child(f++));
        else break;
        for (let g = 0; g < l.length; g++) l[g].to <= s && l.splice(g--, 1);
        for (; o < i.length && i[o].from <= s && i[o].to > s; ) l.push(i[o++]);
        let d = s + u.nodeSize;
        if (u.isText) {
            let g = d;
            o < i.length && i[o].from < g && (g = i[o].from);
            for (let b = 0; b < l.length; b++) l[b].to < g && (g = l[b].to);
            g < d && ((a = u.cut(g - s)), (u = u.cut(0, g - s)), (d = g), (p = -1));
        } else for (; o < i.length && i[o].to < d; ) o++;
        let m = u.isInline && !u.isLeaf ? l.filter((g) => !g.inline) : l.slice();
        n(u, m, e.forChild(s, u), p), (s = d);
    }
}
function Go(r) {
    if (r.nodeName == 'UL' || r.nodeName == 'OL') {
        let e = r.style.cssText;
        (r.style.cssText = e + '; list-style: square !important'), window.getComputedStyle(r).listStyle, (r.style.cssText = e);
    }
}
function Yo(r, e, t, n) {
    for (let i = 0, s = 0; i < r.childCount && s <= n; ) {
        let o = r.child(i++),
            l = s;
        if (((s += o.nodeSize), !o.isText)) continue;
        let a = o.text;
        for (; i < r.childCount; ) {
            let f = r.child(i++);
            if (((s += f.nodeSize), !f.isText)) break;
            a += f.text;
        }
        if (s >= t) {
            if (s >= n && a.slice(n - e.length - l, n - l) == e) return n - e.length;
            let f = l < n ? a.lastIndexOf(e, n - l - 1) : -1;
            if (f >= 0 && f + e.length + l >= t) return l + f;
            if (t == n && a.length >= n + e.length - l && a.slice(n - l, n - l + e.length) == e) return n;
        }
    }
    return -1;
}
function Bn(r, e, t, n, i) {
    let s = [];
    for (let o = 0, l = 0; o < r.length; o++) {
        let a = r[o],
            f = l,
            c = (l += a.size);
        f >= t || c <= e
            ? s.push(a)
            : (f < e && s.push(a.slice(0, e - f, n)),
              i && (s.push(i), (i = void 0)),
              c > t && s.push(a.slice(t - f, a.size, n)));
    }
    return s;
}
function jn(r, e = null) {
    let t = r.domSelectionRange(),
        n = r.state.doc;
    if (!t.focusNode) return null;
    let i = r.docView.nearestDesc(t.focusNode),
        s = i && i.size == 0,
        o = r.docView.posFromDOM(t.focusNode, t.focusOffset, 1);
    if (o < 0) return null;
    let l = n.resolve(o),
        a,
        f;
    if (jt(t)) {
        for (a = o; i && !i.node; ) i = i.parent;
        let h = i.node;
        if (i && h.isAtom && S.isSelectable(h) && i.parent && !(h.isInline && Oo(t.focusNode, t.focusOffset, i.dom))) {
            let u = i.posBefore;
            f = new S(o == u ? l : n.resolve(u));
        }
    } else {
        if (t instanceof r.dom.ownerDocument.defaultView.Selection && t.rangeCount > 1) {
            let h = o,
                u = o;
            for (let p = 0; p < t.rangeCount; p++) {
                let d = t.getRangeAt(p);
                (h = Math.min(h, r.docView.posFromDOM(d.startContainer, d.startOffset, 1))),
                    (u = Math.max(u, r.docView.posFromDOM(d.endContainer, d.endOffset, -1)));
            }
            if (h < 0) return null;
            ([a, o] = u == r.state.selection.anchor ? [u, h] : [h, u]), (l = n.resolve(o));
        } else a = r.docView.posFromDOM(t.anchorNode, t.anchorOffset, 1);
        if (a < 0) return null;
    }
    let c = n.resolve(a);
    if (!f) {
        let h = e == 'pointer' || (r.state.selection.head < l.pos && !s) ? 1 : -1;
        f = Un(r, c, l, h);
    }
    return f;
}
function Xi(r) {
    return r.editable ? r.hasFocus() : Qi(r) && document.activeElement && document.activeElement.contains(r.dom);
}
function ie(r, e = !1) {
    let t = r.state.selection;
    if ((Zi(r, t), !!Xi(r))) {
        if (!e && r.input.mouseDown && r.input.mouseDown.allowDefault && P) {
            let n = r.domSelectionRange(),
                i = r.domObserver.currentSelection;
            if (n.anchorNode && i.anchorNode && Pe(n.anchorNode, n.anchorOffset, i.anchorNode, i.anchorOffset)) {
                (r.input.mouseDown.delayedSelectionSync = !0), r.domObserver.setCurSelection();
                return;
            }
        }
        if ((r.domObserver.disconnectSelection(), r.cursorWrapper)) Zo(r);
        else {
            let { anchor: n, head: i } = t,
                s,
                o;
            mi &&
                !(t instanceof O) &&
                (t.$from.parent.inlineContent || (s = gi(r, t.from)),
                !t.empty && !t.$from.parent.inlineContent && (o = gi(r, t.to))),
                r.docView.setSelection(n, i, r, e),
                mi && (s && yi(s), o && yi(o)),
                t.visible
                    ? r.dom.classList.remove('ProseMirror-hideselection')
                    : (r.dom.classList.add('ProseMirror-hideselection'), 'onselectionchange' in document && Xo(r));
        }
        r.domObserver.setCurSelection(), r.domObserver.connectSelection();
    }
}
var mi = F || (P && Ji < 63);
function gi(r, e) {
    let { node: t, offset: n } = r.docView.domFromPos(e, 0),
        i = n < t.childNodes.length ? t.childNodes[n] : null,
        s = n ? t.childNodes[n - 1] : null;
    if (F && i && i.contentEditable == 'false') return Cn(i);
    if ((!i || i.contentEditable == 'false') && (!s || s.contentEditable == 'false')) {
        if (i) return Cn(i);
        if (s) return Cn(s);
    }
}
function Cn(r) {
    return (r.contentEditable = 'true'), F && r.draggable && ((r.draggable = !1), (r.wasDraggable = !0)), r;
}
function yi(r) {
    (r.contentEditable = 'false'), r.wasDraggable && ((r.draggable = !0), (r.wasDraggable = null));
}
function Xo(r) {
    let e = r.dom.ownerDocument;
    e.removeEventListener('selectionchange', r.input.hideSelectionGuard);
    let t = r.domSelectionRange(),
        n = t.anchorNode,
        i = t.anchorOffset;
    e.addEventListener(
        'selectionchange',
        (r.input.hideSelectionGuard = () => {
            (t.anchorNode != n || t.anchorOffset != i) &&
                (e.removeEventListener('selectionchange', r.input.hideSelectionGuard),
                setTimeout(() => {
                    (!Xi(r) || r.state.selection.visible) && r.dom.classList.remove('ProseMirror-hideselection');
                }, 20));
        }),
    );
}
function Zo(r) {
    let e = r.domSelection(),
        t = document.createRange();
    if (!e) return;
    let n = r.cursorWrapper.dom,
        i = n.nodeName == 'IMG';
    i ? t.setStart(n.parentNode, A(n) + 1) : t.setStart(n, 0),
        t.collapse(!0),
        e.removeAllRanges(),
        e.addRange(t),
        !i && !r.state.selection.visible && J && pe <= 11 && ((n.disabled = !0), (n.disabled = !1));
}
function Zi(r, e) {
    if (e instanceof S) {
        let t = r.docView.descAt(e.from);
        t != r.lastSelectedViewDesc && (xi(r), t && t.selectNode(), (r.lastSelectedViewDesc = t));
    } else xi(r);
}
function xi(r) {
    r.lastSelectedViewDesc &&
        (r.lastSelectedViewDesc.parent && r.lastSelectedViewDesc.deselectNode(), (r.lastSelectedViewDesc = void 0));
}
function Un(r, e, t, n) {
    return r.someProp('createSelectionBetween', (i) => i(r, e, t)) || O.between(e, t, n);
}
function bi(r) {
    return r.editable && !r.hasFocus() ? !1 : Qi(r);
}
function Qi(r) {
    let e = r.domSelectionRange();
    if (!e.anchorNode) return !1;
    try {
        return (
            r.dom.contains(e.anchorNode.nodeType == 3 ? e.anchorNode.parentNode : e.anchorNode) &&
            (r.editable || r.dom.contains(e.focusNode.nodeType == 3 ? e.focusNode.parentNode : e.focusNode))
        );
    } catch {
        return !1;
    }
}
function Qo(r) {
    let e = r.docView.domFromPos(r.state.selection.anchor, 0),
        t = r.domSelectionRange();
    return Pe(e.node, e.offset, t.anchorNode, t.anchorOffset);
}
function Fn(r, e) {
    let { $anchor: t, $head: n } = r.selection,
        i = e > 0 ? t.max(n) : t.min(n),
        s = i.parent.inlineContent ? (i.depth ? r.doc.resolve(e > 0 ? i.after() : i.before()) : null) : i;
    return s && k.findFrom(s, e);
}
function ue(r, e) {
    return r.dispatch(r.state.tr.setSelection(e).scrollIntoView()), !0;
}
function Si(r, e, t) {
    let n = r.state.selection;
    if (n instanceof O)
        if (t.indexOf('s') > -1) {
            let { $head: i } = n,
                s = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter;
            if (!s || s.isText || !s.isLeaf) return !1;
            let o = r.state.doc.resolve(i.pos + s.nodeSize * (e < 0 ? -1 : 1));
            return ue(r, new O(n.$anchor, o));
        } else if (n.empty) {
            if (r.endOfTextblock(e > 0 ? 'forward' : 'backward')) {
                let i = Fn(r.state, e);
                return i && i instanceof S ? ue(r, i) : !1;
            } else if (!(q && t.indexOf('m') > -1)) {
                let i = n.$head,
                    s = i.textOffset ? null : e < 0 ? i.nodeBefore : i.nodeAfter,
                    o;
                if (!s || s.isText) return !1;
                let l = e < 0 ? i.pos - s.nodeSize : i.pos;
                return s.isAtom || ((o = r.docView.descAt(l)) && !o.contentDOM)
                    ? S.isSelectable(s)
                        ? ue(r, new S(e < 0 ? r.state.doc.resolve(i.pos - s.nodeSize) : i))
                        : bt
                          ? ue(r, new O(r.state.doc.resolve(e < 0 ? l : l + s.nodeSize)))
                          : !1
                    : !1;
            }
        } else return !1;
    else {
        if (n instanceof S && n.node.isInline) return ue(r, new O(e > 0 ? n.$to : n.$from));
        {
            let i = Fn(r.state, e);
            return i ? ue(r, i) : !1;
        }
    }
}
function Wt(r) {
    return r.nodeType == 3 ? r.nodeValue.length : r.childNodes.length;
}
function ut(r, e) {
    let t = r.pmViewDesc;
    return t && t.size == 0 && (e < 0 || r.nextSibling || r.nodeName != 'BR');
}
function qe(r, e) {
    return e < 0 ? _o(r) : el(r);
}
function _o(r) {
    let e = r.domSelectionRange(),
        t = e.focusNode,
        n = e.focusOffset;
    if (!t) return;
    let i,
        s,
        o = !1;
    for (G && t.nodeType == 1 && n < Wt(t) && ut(t.childNodes[n], -1) && (o = !0); ; )
        if (n > 0) {
            if (t.nodeType != 1) break;
            {
                let l = t.childNodes[n - 1];
                if (ut(l, -1)) (i = t), (s = --n);
                else if (l.nodeType == 3) (t = l), (n = t.nodeValue.length);
                else break;
            }
        } else {
            if (_i(t)) break;
            {
                let l = t.previousSibling;
                for (; l && ut(l, -1); ) (i = t.parentNode), (s = A(l)), (l = l.previousSibling);
                if (l) (t = l), (n = Wt(t));
                else {
                    if (((t = t.parentNode), t == r.dom)) break;
                    n = 0;
                }
            }
        }
    o ? vn(r, t, n) : i && vn(r, i, s);
}
function el(r) {
    let e = r.domSelectionRange(),
        t = e.focusNode,
        n = e.focusOffset;
    if (!t) return;
    let i = Wt(t),
        s,
        o;
    for (;;)
        if (n < i) {
            if (t.nodeType != 1) break;
            let l = t.childNodes[n];
            if (ut(l, 1)) (s = t), (o = ++n);
            else break;
        } else {
            if (_i(t)) break;
            {
                let l = t.nextSibling;
                for (; l && ut(l, 1); ) (s = l.parentNode), (o = A(l) + 1), (l = l.nextSibling);
                if (l) (t = l), (n = 0), (i = Wt(t));
                else {
                    if (((t = t.parentNode), t == r.dom)) break;
                    n = i = 0;
                }
            }
        }
    s && vn(r, s, o);
}
function _i(r) {
    let e = r.pmViewDesc;
    return e && e.node && e.node.isBlock;
}
function tl(r, e) {
    for (; r && e == r.childNodes.length && !xt(r); ) (e = A(r) + 1), (r = r.parentNode);
    for (; r && e < r.childNodes.length; ) {
        let t = r.childNodes[e];
        if (t.nodeType == 3) return t;
        if (t.nodeType == 1 && t.contentEditable == 'false') break;
        (r = t), (e = 0);
    }
}
function nl(r, e) {
    for (; r && !e && !xt(r); ) (e = A(r)), (r = r.parentNode);
    for (; r && e; ) {
        let t = r.childNodes[e - 1];
        if (t.nodeType == 3) return t;
        if (t.nodeType == 1 && t.contentEditable == 'false') break;
        (r = t), (e = r.childNodes.length);
    }
}
function vn(r, e, t) {
    if (e.nodeType != 3) {
        let s, o;
        (o = tl(e, t)) ? ((e = o), (t = 0)) : (s = nl(e, t)) && ((e = s), (t = s.nodeValue.length));
    }
    let n = r.domSelection();
    if (!n) return;
    if (jt(n)) {
        let s = document.createRange();
        s.setEnd(e, t), s.setStart(e, t), n.removeAllRanges(), n.addRange(s);
    } else n.extend && n.extend(e, t);
    r.domObserver.setCurSelection();
    let { state: i } = r;
    setTimeout(() => {
        r.state == i && ie(r);
    }, 50);
}
function ki(r, e) {
    let t = r.state.doc.resolve(e);
    if (!(P || Do) && t.parent.inlineContent) {
        let i = r.coordsAtPos(e);
        if (e > t.start()) {
            let s = r.coordsAtPos(e - 1),
                o = (s.top + s.bottom) / 2;
            if (o > i.top && o < i.bottom && Math.abs(s.left - i.left) > 1) return s.left < i.left ? 'ltr' : 'rtl';
        }
        if (e < t.end()) {
            let s = r.coordsAtPos(e + 1),
                o = (s.top + s.bottom) / 2;
            if (o > i.top && o < i.bottom && Math.abs(s.left - i.left) > 1) return s.left > i.left ? 'ltr' : 'rtl';
        }
    }
    return getComputedStyle(r.dom).direction == 'rtl' ? 'rtl' : 'ltr';
}
function Mi(r, e, t) {
    let n = r.state.selection;
    if ((n instanceof O && !n.empty) || t.indexOf('s') > -1 || (q && t.indexOf('m') > -1)) return !1;
    let { $from: i, $to: s } = n;
    if (!i.parent.inlineContent || r.endOfTextblock(e < 0 ? 'up' : 'down')) {
        let o = Fn(r.state, e);
        if (o && o instanceof S) return ue(r, o);
    }
    if (!i.parent.inlineContent) {
        let o = e < 0 ? i : s,
            l = n instanceof $ ? k.near(o, e) : k.findFrom(o, e);
        return l ? ue(r, l) : !1;
    }
    return !1;
}
function Ci(r, e) {
    if (!(r.state.selection instanceof O)) return !0;
    let { $head: t, $anchor: n, empty: i } = r.state.selection;
    if (!t.sameParent(n)) return !0;
    if (!i) return !1;
    if (r.endOfTextblock(e > 0 ? 'forward' : 'backward')) return !0;
    let s = !t.textOffset && (e < 0 ? t.nodeBefore : t.nodeAfter);
    if (s && !s.isText) {
        let o = r.state.tr;
        return e < 0 ? o.delete(t.pos - s.nodeSize, t.pos) : o.delete(t.pos, t.pos + s.nodeSize), r.dispatch(o), !0;
    }
    return !1;
}
function Oi(r, e, t) {
    r.domObserver.stop(), (e.contentEditable = t), r.domObserver.start();
}
function rl(r) {
    if (!F || r.state.selection.$head.parentOffset > 0) return !1;
    let { focusNode: e, focusOffset: t } = r.domSelectionRange();
    if (e && e.nodeType == 1 && t == 0 && e.firstChild && e.firstChild.contentEditable == 'false') {
        let n = e.firstChild;
        Oi(r, n, 'true'), setTimeout(() => Oi(r, n, 'false'), 20);
    }
    return !1;
}
function il(r) {
    let e = '';
    return r.ctrlKey && (e += 'c'), r.metaKey && (e += 'm'), r.altKey && (e += 'a'), r.shiftKey && (e += 's'), e;
}
function sl(r, e) {
    let t = e.keyCode,
        n = il(e);
    if (t == 8 || (q && t == 72 && n == 'c')) return Ci(r, -1) || qe(r, -1);
    if ((t == 46 && !e.shiftKey) || (q && t == 68 && n == 'c')) return Ci(r, 1) || qe(r, 1);
    if (t == 13 || t == 27) return !0;
    if (t == 37 || (q && t == 66 && n == 'c')) {
        let i = t == 37 ? (ki(r, r.state.selection.from) == 'ltr' ? -1 : 1) : -1;
        return Si(r, i, n) || qe(r, i);
    } else if (t == 39 || (q && t == 70 && n == 'c')) {
        let i = t == 39 ? (ki(r, r.state.selection.from) == 'ltr' ? 1 : -1) : 1;
        return Si(r, i, n) || qe(r, i);
    } else {
        if (t == 38 || (q && t == 80 && n == 'c')) return Mi(r, -1, n) || qe(r, -1);
        if (t == 40 || (q && t == 78 && n == 'c')) return rl(r) || Mi(r, 1, n) || qe(r, 1);
        if (n == (q ? 'm' : 'c') && (t == 66 || t == 73 || t == 89 || t == 90)) return !0;
    }
    return !1;
}
function Gn(r, e) {
    r.someProp('transformCopied', (p) => {
        e = p(e, r);
    });
    let t = [],
        { content: n, openStart: i, openEnd: s } = e;
    for (; i > 1 && s > 1 && n.childCount == 1 && n.firstChild.childCount == 1; ) {
        i--, s--;
        let p = n.firstChild;
        t.push(p.type.name, p.attrs != p.type.defaultAttrs ? p.attrs : null), (n = p.content);
    }
    let o = r.someProp('clipboardSerializer') || Oe.fromSchema(r.state.schema),
        l = is(),
        a = l.createElement('div');
    a.appendChild(o.serializeFragment(n, { document: l }));
    let f = a.firstChild,
        c,
        h = 0;
    for (; f && f.nodeType == 1 && (c = rs[f.nodeName.toLowerCase()]); ) {
        for (let p = c.length - 1; p >= 0; p--) {
            let d = l.createElement(c[p]);
            for (; a.firstChild; ) d.appendChild(a.firstChild);
            a.appendChild(d), h++;
        }
        f = a.firstChild;
    }
    f && f.nodeType == 1 && f.setAttribute('data-pm-slice', `${i} ${s}${h ? ` -${h}` : ''} ${JSON.stringify(t)}`);
    let u =
        r.someProp('clipboardTextSerializer', (p) => p(e, r)) ||
        e.content.textBetween(
            0,
            e.content.size,
            `

`,
        );
    return { dom: a, text: u, slice: e };
}
function Yn(r, e, t, n, i) {
    let s = i.parent.type.spec.code,
        o,
        l;
    if (!t && !e) return null;
    let a = e && (n || s || !t);
    if (a) {
        if (
            (r.someProp('transformPastedText', (u) => {
                e = u(e, s || n, r);
            }),
            s)
        )
            return e
                ? new x(
                      y.from(
                          r.state.schema.text(
                              e.replace(
                                  /\r\n?/g,
                                  `
`,
                              ),
                          ),
                      ),
                      0,
                      0,
                  )
                : x.empty;
        let h = r.someProp('clipboardTextParser', (u) => u(e, i, n, r));
        if (h) l = h;
        else {
            let u = i.marks(),
                { schema: p } = r.state,
                d = Oe.fromSchema(p);
            (o = document.createElement('div')),
                e.split(/(?:\r\n?|\n)+/).forEach((m) => {
                    let g = o.appendChild(document.createElement('p'));
                    m && g.appendChild(d.serializeNode(p.text(m, u)));
                });
        }
    } else
        r.someProp('transformPastedHTML', (h) => {
            t = h(t, r);
        }),
            (o = fl(t)),
            bt && cl(o);
    let f = o && o.querySelector('[data-pm-slice]'),
        c = f && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(f.getAttribute('data-pm-slice') || '');
    if (c && c[3])
        for (let h = +c[3]; h > 0; h--) {
            let u = o.firstChild;
            for (; u && u.nodeType != 1; ) u = u.nextSibling;
            if (!u) break;
            o = u;
        }
    if (
        (l ||
            (l = (r.someProp('clipboardParser') || r.someProp('domParser') || Qe.fromSchema(r.state.schema)).parseSlice(o, {
                preserveWhitespace: !!(a || c),
                context: i,
                ruleFromNode(u) {
                    return u.nodeName == 'BR' && !u.nextSibling && u.parentNode && !ol.test(u.parentNode.nodeName)
                        ? { ignore: !0 }
                        : null;
                },
            })),
        c)
    )
        l = hl(Ni(l, +c[1], +c[2]), c[4]);
    else if (((l = x.maxOpen(ll(l.content, i), !0)), l.openStart || l.openEnd)) {
        let h = 0,
            u = 0;
        for (let p = l.content.firstChild; h < l.openStart && !p.type.spec.isolating; h++, p = p.firstChild);
        for (let p = l.content.lastChild; u < l.openEnd && !p.type.spec.isolating; u++, p = p.lastChild);
        l = Ni(l, h, u);
    }
    return (
        r.someProp('transformPasted', (h) => {
            l = h(l, r);
        }),
        l
    );
}
var ol = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
function ll(r, e) {
    if (r.childCount < 2) return r;
    for (let t = e.depth; t >= 0; t--) {
        let i = e.node(t).contentMatchAt(e.index(t)),
            s,
            o = [];
        if (
            (r.forEach((l) => {
                if (!o) return;
                let a = i.findWrapping(l.type),
                    f;
                if (!a) return (o = null);
                if ((f = o.length && s.length && ts(a, s, l, o[o.length - 1], 0))) o[o.length - 1] = f;
                else {
                    o.length && (o[o.length - 1] = ns(o[o.length - 1], s.length));
                    let c = es(l, a);
                    o.push(c), (i = i.matchType(c.type)), (s = a);
                }
            }),
            o)
        )
            return y.from(o);
    }
    return r;
}
function es(r, e, t = 0) {
    for (let n = e.length - 1; n >= t; n--) r = e[n].create(null, y.from(r));
    return r;
}
function ts(r, e, t, n, i) {
    if (i < r.length && i < e.length && r[i] == e[i]) {
        let s = ts(r, e, t, n.lastChild, i + 1);
        if (s) return n.copy(n.content.replaceChild(n.childCount - 1, s));
        if (n.contentMatchAt(n.childCount).matchType(i == r.length - 1 ? t.type : r[i + 1]))
            return n.copy(n.content.append(y.from(es(t, r, i + 1))));
    }
}
function ns(r, e) {
    if (e == 0) return r;
    let t = r.content.replaceChild(r.childCount - 1, ns(r.lastChild, e - 1)),
        n = r.contentMatchAt(r.childCount).fillBefore(y.empty, !0);
    return r.copy(t.append(n));
}
function Vn(r, e, t, n, i, s) {
    let o = e < 0 ? r.firstChild : r.lastChild,
        l = o.content;
    return (
        r.childCount > 1 && (s = 0),
        i < n - 1 && (l = Vn(l, e, t, n, i + 1, s)),
        i >= t &&
            (l =
                e < 0
                    ? o
                          .contentMatchAt(0)
                          .fillBefore(l, s <= i)
                          .append(l)
                    : l.append(o.contentMatchAt(o.childCount).fillBefore(y.empty, !0))),
        r.replaceChild(e < 0 ? 0 : r.childCount - 1, o.copy(l))
    );
}
function Ni(r, e, t) {
    return (
        e < r.openStart && (r = new x(Vn(r.content, -1, e, r.openStart, 0, r.openEnd), e, r.openEnd)),
        t < r.openEnd && (r = new x(Vn(r.content, 1, t, r.openEnd, 0, 0), r.openStart, t)),
        r
    );
}
var rs = {
        thead: ['table'],
        tbody: ['table'],
        tfoot: ['table'],
        caption: ['table'],
        colgroup: ['table'],
        col: ['table', 'colgroup'],
        tr: ['table', 'tbody'],
        td: ['table', 'tbody', 'tr'],
        th: ['table', 'tbody', 'tr'],
    },
    wi = null;
function is() {
    return wi || (wi = document.implementation.createHTMLDocument('title'));
}
var On = null;
function al(r) {
    let e = window.trustedTypes;
    return e ? (On || (On = e.createPolicy('ProseMirrorClipboard', { createHTML: (t) => t })), On.createHTML(r)) : r;
}
function fl(r) {
    let e = /^(\s*<meta [^>]*>)*/.exec(r);
    e && (r = r.slice(e[0].length));
    let t = is().createElement('div'),
        n = /<([a-z][^>\s]+)/i.exec(r),
        i;
    if (
        ((i = n && rs[n[1].toLowerCase()]) &&
            (r =
                i.map((s) => '<' + s + '>').join('') +
                r +
                i
                    .map((s) => '</' + s + '>')
                    .reverse()
                    .join('')),
        (t.innerHTML = al(r)),
        i)
    )
        for (let s = 0; s < i.length; s++) t = t.querySelector(i[s]) || t;
    return t;
}
function cl(r) {
    let e = r.querySelectorAll(P ? 'span:not([class]):not([style])' : 'span.Apple-converted-space');
    for (let t = 0; t < e.length; t++) {
        let n = e[t];
        n.childNodes.length == 1 &&
            n.textContent == '\xA0' &&
            n.parentNode &&
            n.parentNode.replaceChild(r.ownerDocument.createTextNode(' '), n);
    }
}
function hl(r, e) {
    if (!r.size) return r;
    let t = r.content.firstChild.type.schema,
        n;
    try {
        n = JSON.parse(e);
    } catch {
        return r;
    }
    let { content: i, openStart: s, openEnd: o } = r;
    for (let l = n.length - 2; l >= 0; l -= 2) {
        let a = t.nodes[n[l]];
        if (!a || a.hasRequiredAttrs()) break;
        (i = y.from(a.create(n[l + 1], i))), s++, o++;
    }
    return new x(i, s, o);
}
var v = {},
    V = {},
    ul = { touchstart: !0, touchmove: !0 },
    Ln = class {
        constructor() {
            (this.shiftKey = !1),
                (this.mouseDown = null),
                (this.lastKeyCode = null),
                (this.lastKeyCodeTime = 0),
                (this.lastClick = { time: 0, x: 0, y: 0, type: '' }),
                (this.lastSelectionOrigin = null),
                (this.lastSelectionTime = 0),
                (this.lastIOSEnter = 0),
                (this.lastIOSEnterFallbackTimeout = -1),
                (this.lastFocus = 0),
                (this.lastTouch = 0),
                (this.lastAndroidDelete = 0),
                (this.composing = !1),
                (this.compositionNode = null),
                (this.composingTimeout = -1),
                (this.compositionNodes = []),
                (this.compositionEndedAt = -2e8),
                (this.compositionID = 1),
                (this.compositionPendingChanges = 0),
                (this.domChangeCount = 0),
                (this.eventHandlers = Object.create(null)),
                (this.hideSelectionGuard = null);
        }
    };
function dl(r) {
    for (let e in v) {
        let t = v[e];
        r.dom.addEventListener(
            e,
            (r.input.eventHandlers[e] = (n) => {
                ml(r, n) && !Xn(r, n) && (r.editable || !(n.type in V)) && t(r, n);
            }),
            ul[e] ? { passive: !0 } : void 0,
        );
    }
    F && r.dom.addEventListener('input', () => null), Jn(r);
}
function de(r, e) {
    (r.input.lastSelectionOrigin = e), (r.input.lastSelectionTime = Date.now());
}
function pl(r) {
    r.domObserver.stop();
    for (let e in r.input.eventHandlers) r.dom.removeEventListener(e, r.input.eventHandlers[e]);
    clearTimeout(r.input.composingTimeout), clearTimeout(r.input.lastIOSEnterFallbackTimeout);
}
function Jn(r) {
    r.someProp('handleDOMEvents', (e) => {
        for (let t in e) r.input.eventHandlers[t] || r.dom.addEventListener(t, (r.input.eventHandlers[t] = (n) => Xn(r, n)));
    });
}
function Xn(r, e) {
    return r.someProp('handleDOMEvents', (t) => {
        let n = t[e.type];
        return n ? n(r, e) || e.defaultPrevented : !1;
    });
}
function ml(r, e) {
    if (!e.bubbles) return !0;
    if (e.defaultPrevented) return !1;
    for (let t = e.target; t != r.dom; t = t.parentNode)
        if (!t || t.nodeType == 11 || (t.pmViewDesc && t.pmViewDesc.stopEvent(e))) return !1;
    return !0;
}
function gl(r, e) {
    !Xn(r, e) && v[e.type] && (r.editable || !(e.type in V)) && v[e.type](r, e);
}
V.keydown = (r, e) => {
    let t = e;
    if (
        ((r.input.shiftKey = t.keyCode == 16 || t.shiftKey),
        !ls(r, t) && ((r.input.lastKeyCode = t.keyCode), (r.input.lastKeyCodeTime = Date.now()), !(U && P && t.keyCode == 13)))
    )
        if ((t.keyCode != 229 && r.domObserver.forceFlush(), je && t.keyCode == 13 && !t.ctrlKey && !t.altKey && !t.metaKey)) {
            let n = Date.now();
            (r.input.lastIOSEnter = n),
                (r.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
                    r.input.lastIOSEnter == n &&
                        (r.someProp('handleKeyDown', (i) => i(r, Te(13, 'Enter'))), (r.input.lastIOSEnter = 0));
                }, 200));
        } else r.someProp('handleKeyDown', (n) => n(r, t)) || sl(r, t) ? t.preventDefault() : de(r, 'key');
};
V.keyup = (r, e) => {
    e.keyCode == 16 && (r.input.shiftKey = !1);
};
V.keypress = (r, e) => {
    let t = e;
    if (ls(r, t) || !t.charCode || (t.ctrlKey && !t.altKey) || (q && t.metaKey)) return;
    if (r.someProp('handleKeyPress', (i) => i(r, t))) {
        t.preventDefault();
        return;
    }
    let n = r.state.selection;
    if (!(n instanceof O) || !n.$from.sameParent(n.$to)) {
        let i = String.fromCharCode(t.charCode);
        !/[\r\n]/.test(i) &&
            !r.someProp('handleTextInput', (s) => s(r, n.$from.pos, n.$to.pos, i)) &&
            r.dispatch(r.state.tr.insertText(i).scrollIntoView()),
            t.preventDefault();
    }
};
function Ut(r) {
    return { left: r.clientX, top: r.clientY };
}
function yl(r, e) {
    let t = e.x - r.clientX,
        n = e.y - r.clientY;
    return t * t + n * n < 100;
}
function Zn(r, e, t, n, i) {
    if (n == -1) return !1;
    let s = r.state.doc.resolve(n);
    for (let o = s.depth + 1; o > 0; o--)
        if (
            r.someProp(e, (l) =>
                o > s.depth ? l(r, t, s.nodeAfter, s.before(o), i, !0) : l(r, t, s.node(o), s.before(o), i, !1),
            )
        )
            return !0;
    return !1;
}
function He(r, e, t) {
    if ((r.focused || r.focus(), r.state.selection.eq(e))) return;
    let n = r.state.tr.setSelection(e);
    t == 'pointer' && n.setMeta('pointer', !0), r.dispatch(n);
}
function xl(r, e) {
    if (e == -1) return !1;
    let t = r.state.doc.resolve(e),
        n = t.nodeAfter;
    return n && n.isAtom && S.isSelectable(n) ? (He(r, new S(t), 'pointer'), !0) : !1;
}
function bl(r, e) {
    if (e == -1) return !1;
    let t = r.state.selection,
        n,
        i;
    t instanceof S && (n = t.node);
    let s = r.state.doc.resolve(e);
    for (let o = s.depth + 1; o > 0; o--) {
        let l = o > s.depth ? s.nodeAfter : s.node(o);
        if (S.isSelectable(l)) {
            n && t.$from.depth > 0 && o >= t.$from.depth && s.before(t.$from.depth + 1) == t.$from.pos
                ? (i = s.before(t.$from.depth))
                : (i = s.before(o));
            break;
        }
    }
    return i != null ? (He(r, S.create(r.state.doc, i), 'pointer'), !0) : !1;
}
function Sl(r, e, t, n, i) {
    return Zn(r, 'handleClickOn', e, t, n) || r.someProp('handleClick', (s) => s(r, e, n)) || (i ? bl(r, t) : xl(r, t));
}
function kl(r, e, t, n) {
    return Zn(r, 'handleDoubleClickOn', e, t, n) || r.someProp('handleDoubleClick', (i) => i(r, e, n));
}
function Ml(r, e, t, n) {
    return Zn(r, 'handleTripleClickOn', e, t, n) || r.someProp('handleTripleClick', (i) => i(r, e, n)) || Cl(r, t, n);
}
function Cl(r, e, t) {
    if (t.button != 0) return !1;
    let n = r.state.doc;
    if (e == -1) return n.inlineContent ? (He(r, O.create(n, 0, n.content.size), 'pointer'), !0) : !1;
    let i = n.resolve(e);
    for (let s = i.depth + 1; s > 0; s--) {
        let o = s > i.depth ? i.nodeAfter : i.node(s),
            l = i.before(s);
        if (o.inlineContent) He(r, O.create(n, l + 1, l + 1 + o.content.size), 'pointer');
        else if (S.isSelectable(o)) He(r, S.create(n, l), 'pointer');
        else continue;
        return !0;
    }
}
function Qn(r) {
    return pt(r);
}
var ss = q ? 'metaKey' : 'ctrlKey';
v.mousedown = (r, e) => {
    let t = e;
    r.input.shiftKey = t.shiftKey;
    let n = Qn(r),
        i = Date.now(),
        s = 'singleClick';
    i - r.input.lastClick.time < 500 &&
        yl(t, r.input.lastClick) &&
        !t[ss] &&
        (r.input.lastClick.type == 'singleClick'
            ? (s = 'doubleClick')
            : r.input.lastClick.type == 'doubleClick' && (s = 'tripleClick')),
        (r.input.lastClick = { time: i, x: t.clientX, y: t.clientY, type: s });
    let o = r.posAtCoords(Ut(t));
    o &&
        (s == 'singleClick'
            ? (r.input.mouseDown && r.input.mouseDown.done(), (r.input.mouseDown = new Wn(r, o, t, !!n)))
            : (s == 'doubleClick' ? kl : Ml)(r, o.pos, o.inside, t)
              ? t.preventDefault()
              : de(r, 'pointer'));
};
var Wn = class {
    constructor(e, t, n, i) {
        (this.view = e),
            (this.pos = t),
            (this.event = n),
            (this.flushed = i),
            (this.delayedSelectionSync = !1),
            (this.mightDrag = null),
            (this.startDoc = e.state.doc),
            (this.selectNode = !!n[ss]),
            (this.allowDefault = n.shiftKey);
        let s, o;
        if (t.inside > -1) (s = e.state.doc.nodeAt(t.inside)), (o = t.inside);
        else {
            let c = e.state.doc.resolve(t.pos);
            (s = c.parent), (o = c.depth ? c.before() : 0);
        }
        let l = i ? null : n.target,
            a = l ? e.docView.nearestDesc(l, !0) : null;
        this.target = a && a.dom.nodeType == 1 ? a.dom : null;
        let { selection: f } = e.state;
        ((n.button == 0 && s.type.spec.draggable && s.type.spec.selectable !== !1) ||
            (f instanceof S && f.from <= o && f.to > o)) &&
            (this.mightDrag = {
                node: s,
                pos: o,
                addAttr: !!(this.target && !this.target.draggable),
                setUneditable: !!(this.target && G && !this.target.hasAttribute('contentEditable')),
            }),
            this.target &&
                this.mightDrag &&
                (this.mightDrag.addAttr || this.mightDrag.setUneditable) &&
                (this.view.domObserver.stop(),
                this.mightDrag.addAttr && (this.target.draggable = !0),
                this.mightDrag.setUneditable &&
                    setTimeout(() => {
                        this.view.input.mouseDown == this && this.target.setAttribute('contentEditable', 'false');
                    }, 20),
                this.view.domObserver.start()),
            e.root.addEventListener('mouseup', (this.up = this.up.bind(this))),
            e.root.addEventListener('mousemove', (this.move = this.move.bind(this))),
            de(e, 'pointer');
    }
    done() {
        this.view.root.removeEventListener('mouseup', this.up),
            this.view.root.removeEventListener('mousemove', this.move),
            this.mightDrag &&
                this.target &&
                (this.view.domObserver.stop(),
                this.mightDrag.addAttr && this.target.removeAttribute('draggable'),
                this.mightDrag.setUneditable && this.target.removeAttribute('contentEditable'),
                this.view.domObserver.start()),
            this.delayedSelectionSync && setTimeout(() => ie(this.view)),
            (this.view.input.mouseDown = null);
    }
    up(e) {
        if ((this.done(), !this.view.dom.contains(e.target))) return;
        let t = this.pos;
        this.view.state.doc != this.startDoc && (t = this.view.posAtCoords(Ut(e))),
            this.updateAllowDefault(e),
            this.allowDefault || !t
                ? de(this.view, 'pointer')
                : Sl(this.view, t.pos, t.inside, e, this.selectNode)
                  ? e.preventDefault()
                  : e.button == 0 &&
                      (this.flushed ||
                          (F && this.mightDrag && !this.mightDrag.node.isAtom) ||
                          (P &&
                              !this.view.state.selection.visible &&
                              Math.min(
                                  Math.abs(t.pos - this.view.state.selection.from),
                                  Math.abs(t.pos - this.view.state.selection.to),
                              ) <= 2))
                    ? (He(this.view, k.near(this.view.state.doc.resolve(t.pos)), 'pointer'), e.preventDefault())
                    : de(this.view, 'pointer');
    }
    move(e) {
        this.updateAllowDefault(e), de(this.view, 'pointer'), e.buttons == 0 && this.done();
    }
    updateAllowDefault(e) {
        !this.allowDefault &&
            (Math.abs(this.event.x - e.clientX) > 4 || Math.abs(this.event.y - e.clientY) > 4) &&
            (this.allowDefault = !0);
    }
};
v.touchstart = (r) => {
    (r.input.lastTouch = Date.now()), Qn(r), de(r, 'pointer');
};
v.touchmove = (r) => {
    (r.input.lastTouch = Date.now()), de(r, 'pointer');
};
v.contextmenu = (r) => Qn(r);
function ls(r, e) {
    return r.composing
        ? !0
        : F && Math.abs(e.timeStamp - r.input.compositionEndedAt) < 500
          ? ((r.input.compositionEndedAt = -2e8), !0)
          : !1;
}
var Ol = U ? 5e3 : -1;
V.compositionstart = V.compositionupdate = (r) => {
    if (!r.composing) {
        r.domObserver.flush();
        let { state: e } = r,
            t = e.selection.$to;
        if (
            e.selection instanceof O &&
            (e.storedMarks || (!t.textOffset && t.parentOffset && t.nodeBefore.marks.some((n) => n.type.spec.inclusive === !1)))
        )
            (r.markCursor = r.state.storedMarks || t.marks()), pt(r, !0), (r.markCursor = null);
        else if (
            (pt(r, !e.selection.empty), G && e.selection.empty && t.parentOffset && !t.textOffset && t.nodeBefore.marks.length)
        ) {
            let n = r.domSelectionRange();
            for (let i = n.focusNode, s = n.focusOffset; i && i.nodeType == 1 && s != 0; ) {
                let o = s < 0 ? i.lastChild : i.childNodes[s - 1];
                if (!o) break;
                if (o.nodeType == 3) {
                    let l = r.domSelection();
                    l && l.collapse(o, o.nodeValue.length);
                    break;
                } else (i = o), (s = -1);
            }
        }
        r.input.composing = !0;
    }
    as(r, Ol);
};
V.compositionend = (r, e) => {
    r.composing &&
        ((r.input.composing = !1),
        (r.input.compositionEndedAt = e.timeStamp),
        (r.input.compositionPendingChanges = r.domObserver.pendingRecords().length ? r.input.compositionID : 0),
        (r.input.compositionNode = null),
        r.input.compositionPendingChanges && Promise.resolve().then(() => r.domObserver.flush()),
        r.input.compositionID++,
        as(r, 20));
};
function as(r, e) {
    clearTimeout(r.input.composingTimeout), e > -1 && (r.input.composingTimeout = setTimeout(() => pt(r), e));
}
function fs(r) {
    for (r.composing && ((r.input.composing = !1), (r.input.compositionEndedAt = wl())); r.input.compositionNodes.length > 0; )
        r.input.compositionNodes.pop().markParentsDirty();
}
function Nl(r) {
    let e = r.domSelectionRange();
    if (!e.focusNode) return null;
    let t = Mo(e.focusNode, e.focusOffset),
        n = Co(e.focusNode, e.focusOffset);
    if (t && n && t != n) {
        let i = n.pmViewDesc,
            s = r.domObserver.lastChangedTextNode;
        if (t == s || n == s) return s;
        if (!i || !i.isText(n.nodeValue)) return n;
        if (r.input.compositionNode == n) {
            let o = t.pmViewDesc;
            if (!(!o || !o.isText(t.nodeValue))) return n;
        }
    }
    return t || n;
}
function wl() {
    let r = document.createEvent('Event');
    return r.initEvent('event', !0, !0), r.timeStamp;
}
function pt(r, e = !1) {
    if (!(U && r.domObserver.flushingSoon >= 0)) {
        if ((r.domObserver.forceFlush(), fs(r), e || (r.docView && r.docView.dirty))) {
            let t = jn(r);
            return (
                t && !t.eq(r.state.selection)
                    ? r.dispatch(r.state.tr.setSelection(t))
                    : (r.markCursor || e) && !r.state.selection.empty
                      ? r.dispatch(r.state.tr.deleteSelection())
                      : r.updateState(r.state),
                !0
            );
        }
        return !1;
    }
}
function Dl(r, e) {
    if (!r.dom.parentNode) return;
    let t = r.dom.parentNode.appendChild(document.createElement('div'));
    t.appendChild(e), (t.style.cssText = 'position: fixed; left: -10000px; top: 10px');
    let n = getSelection(),
        i = document.createRange();
    i.selectNodeContents(e),
        r.dom.blur(),
        n.removeAllRanges(),
        n.addRange(i),
        setTimeout(() => {
            t.parentNode && t.parentNode.removeChild(t), r.focus();
        }, 50);
}
var mt = (J && pe < 15) || (je && To < 604);
v.copy = V.cut = (r, e) => {
    let t = e,
        n = r.state.selection,
        i = t.type == 'cut';
    if (n.empty) return;
    let s = mt ? null : t.clipboardData,
        o = n.content(),
        { dom: l, text: a } = Gn(r, o);
    s ? (t.preventDefault(), s.clearData(), s.setData('text/html', l.innerHTML), s.setData('text/plain', a)) : Dl(r, l),
        i && r.dispatch(r.state.tr.deleteSelection().scrollIntoView().setMeta('uiEvent', 'cut'));
};
function Tl(r) {
    return r.openStart == 0 && r.openEnd == 0 && r.content.childCount == 1 ? r.content.firstChild : null;
}
function El(r, e) {
    if (!r.dom.parentNode) return;
    let t = r.input.shiftKey || r.state.selection.$from.parent.type.spec.code,
        n = r.dom.parentNode.appendChild(document.createElement(t ? 'textarea' : 'div'));
    t || (n.contentEditable = 'true'), (n.style.cssText = 'position: fixed; left: -10000px; top: 10px'), n.focus();
    let i = r.input.shiftKey && r.input.lastKeyCode != 45;
    setTimeout(() => {
        r.focus(),
            n.parentNode && n.parentNode.removeChild(n),
            t ? gt(r, n.value, null, i, e) : gt(r, n.textContent, n.innerHTML, i, e);
    }, 50);
}
function gt(r, e, t, n, i) {
    let s = Yn(r, e, t, n, r.state.selection.$from);
    if (r.someProp('handlePaste', (a) => a(r, i, s || x.empty))) return !0;
    if (!s) return !1;
    let o = Tl(s),
        l = o ? r.state.tr.replaceSelectionWith(o, n) : r.state.tr.replaceSelection(s);
    return r.dispatch(l.scrollIntoView().setMeta('paste', !0).setMeta('uiEvent', 'paste')), !0;
}
function cs(r) {
    let e = r.getData('text/plain') || r.getData('Text');
    if (e) return e;
    let t = r.getData('text/uri-list');
    return t ? t.replace(/\r?\n/g, ' ') : '';
}
V.paste = (r, e) => {
    let t = e;
    if (r.composing && !U) return;
    let n = mt ? null : t.clipboardData,
        i = r.input.shiftKey && r.input.lastKeyCode != 45;
    n && gt(r, cs(n), n.getData('text/html'), i, t) ? t.preventDefault() : El(r, t);
};
var $t = class {
        constructor(e, t, n) {
            (this.slice = e), (this.move = t), (this.node = n);
        }
    },
    hs = q ? 'altKey' : 'ctrlKey';
v.dragstart = (r, e) => {
    let t = e,
        n = r.input.mouseDown;
    if ((n && n.done(), !t.dataTransfer)) return;
    let i = r.state.selection,
        s = i.empty ? null : r.posAtCoords(Ut(t)),
        o;
    if (!(s && s.pos >= i.from && s.pos <= (i instanceof S ? i.to - 1 : i.to))) {
        if (n && n.mightDrag) o = S.create(r.state.doc, n.mightDrag.pos);
        else if (t.target && t.target.nodeType == 1) {
            let h = r.docView.nearestDesc(t.target, !0);
            h && h.node.type.spec.draggable && h != r.docView && (o = S.create(r.state.doc, h.posBefore));
        }
    }
    let l = (o || r.state.selection).content(),
        { dom: a, text: f, slice: c } = Gn(r, l);
    (!t.dataTransfer.files.length || !P || Ji > 120) && t.dataTransfer.clearData(),
        t.dataTransfer.setData(mt ? 'Text' : 'text/html', a.innerHTML),
        (t.dataTransfer.effectAllowed = 'copyMove'),
        mt || t.dataTransfer.setData('text/plain', f),
        (r.dragging = new $t(c, !t[hs], o));
};
v.dragend = (r) => {
    let e = r.dragging;
    window.setTimeout(() => {
        r.dragging == e && (r.dragging = null);
    }, 50);
};
V.dragover = V.dragenter = (r, e) => e.preventDefault();
V.drop = (r, e) => {
    let t = e,
        n = r.dragging;
    if (((r.dragging = null), !t.dataTransfer)) return;
    let i = r.posAtCoords(Ut(t));
    if (!i) return;
    let s = r.state.doc.resolve(i.pos),
        o = n && n.slice;
    o
        ? r.someProp('transformPasted', (d) => {
              o = d(o, r);
          })
        : (o = Yn(r, cs(t.dataTransfer), mt ? null : t.dataTransfer.getData('text/html'), !1, s));
    let l = !!(n && !t[hs]);
    if (r.someProp('handleDrop', (d) => d(r, t, o || x.empty, l))) {
        t.preventDefault();
        return;
    }
    if (!o) return;
    t.preventDefault();
    let a = o ? Hr(r.state.doc, s.pos, o) : s.pos;
    a == null && (a = s.pos);
    let f = r.state.tr;
    if (l) {
        let { node: d } = n;
        d ? d.replace(f) : f.deleteSelection();
    }
    let c = f.mapping.map(a),
        h = o.openStart == 0 && o.openEnd == 0 && o.content.childCount == 1,
        u = f.doc;
    if ((h ? f.replaceRangeWith(c, c, o.content.firstChild) : f.replaceRange(c, c, o), f.doc.eq(u))) return;
    let p = f.doc.resolve(c);
    if (h && S.isSelectable(o.content.firstChild) && p.nodeAfter && p.nodeAfter.sameMarkup(o.content.firstChild))
        f.setSelection(new S(p));
    else {
        let d = f.mapping.map(a);
        f.mapping.maps[f.mapping.maps.length - 1].forEach((m, g, b, N) => (d = N)), f.setSelection(Un(r, p, f.doc.resolve(d)));
    }
    r.focus(), r.dispatch(f.setMeta('uiEvent', 'drop'));
};
v.focus = (r) => {
    (r.input.lastFocus = Date.now()),
        r.focused ||
            (r.domObserver.stop(),
            r.dom.classList.add('ProseMirror-focused'),
            r.domObserver.start(),
            (r.focused = !0),
            setTimeout(() => {
                r.docView && r.hasFocus() && !r.domObserver.currentSelection.eq(r.domSelectionRange()) && ie(r);
            }, 20));
};
v.blur = (r, e) => {
    let t = e;
    r.focused &&
        (r.domObserver.stop(),
        r.dom.classList.remove('ProseMirror-focused'),
        r.domObserver.start(),
        t.relatedTarget && r.dom.contains(t.relatedTarget) && r.domObserver.currentSelection.clear(),
        (r.focused = !1));
};
v.beforeinput = (r, e) => {
    if (P && U && e.inputType == 'deleteContentBackward') {
        r.domObserver.flushSoon();
        let { domChangeCount: n } = r.input;
        setTimeout(() => {
            if (
                r.input.domChangeCount != n ||
                (r.dom.blur(), r.focus(), r.someProp('handleKeyDown', (s) => s(r, Te(8, 'Backspace'))))
            )
                return;
            let { $cursor: i } = r.state.selection;
            i && i.pos > 0 && r.dispatch(r.state.tr.delete(i.pos - 1, i.pos).scrollIntoView());
        }, 50);
    }
};
for (let r in V) v[r] = V[r];
function yt(r, e) {
    if (r == e) return !0;
    for (let t in r) if (r[t] !== e[t]) return !1;
    for (let t in e) if (!(t in r)) return !1;
    return !0;
}
var qt = class r {
        constructor(e, t) {
            (this.toDOM = e), (this.spec = t || Re), (this.side = this.spec.side || 0);
        }
        map(e, t, n, i) {
            let { pos: s, deleted: o } = e.mapResult(t.from + i, this.side < 0 ? -1 : 1);
            return o ? null : new ge(s - n, s - n, this);
        }
        valid() {
            return !0;
        }
        eq(e) {
            return (
                this == e ||
                (e instanceof r &&
                    ((this.spec.key && this.spec.key == e.spec.key) || (this.toDOM == e.toDOM && yt(this.spec, e.spec))))
            );
        }
        destroy(e) {
            this.spec.destroy && this.spec.destroy(e);
        }
    },
    Ie = class r {
        constructor(e, t) {
            (this.attrs = e), (this.spec = t || Re);
        }
        map(e, t, n, i) {
            let s = e.map(t.from + i, this.spec.inclusiveStart ? -1 : 1) - n,
                o = e.map(t.to + i, this.spec.inclusiveEnd ? 1 : -1) - n;
            return s >= o ? null : new ge(s, o, this);
        }
        valid(e, t) {
            return t.from < t.to;
        }
        eq(e) {
            return this == e || (e instanceof r && yt(this.attrs, e.attrs) && yt(this.spec, e.spec));
        }
        static is(e) {
            return e.type instanceof r;
        }
        destroy() {}
    },
    $n = class r {
        constructor(e, t) {
            (this.attrs = e), (this.spec = t || Re);
        }
        map(e, t, n, i) {
            let s = e.mapResult(t.from + i, 1);
            if (s.deleted) return null;
            let o = e.mapResult(t.to + i, -1);
            return o.deleted || o.pos <= s.pos ? null : new ge(s.pos - n, o.pos - n, this);
        }
        valid(e, t) {
            let { index: n, offset: i } = e.content.findIndex(t.from),
                s;
            return i == t.from && !(s = e.child(n)).isText && i + s.nodeSize == t.to;
        }
        eq(e) {
            return this == e || (e instanceof r && yt(this.attrs, e.attrs) && yt(this.spec, e.spec));
        }
        destroy() {}
    },
    ge = class r {
        constructor(e, t, n) {
            (this.from = e), (this.to = t), (this.type = n);
        }
        copy(e, t) {
            return new r(e, t, this.type);
        }
        eq(e, t = 0) {
            return this.type.eq(e.type) && this.from + t == e.from && this.to + t == e.to;
        }
        map(e, t, n) {
            return this.type.map(e, this, t, n);
        }
        static widget(e, t, n) {
            return new r(e, e, new qt(t, n));
        }
        static inline(e, t, n, i) {
            return new r(e, t, new Ie(n, i));
        }
        static node(e, t, n, i) {
            return new r(e, t, new $n(n, i));
        }
        get spec() {
            return this.type.spec;
        }
        get inline() {
            return this.type instanceof Ie;
        }
        get widget() {
            return this.type instanceof qt;
        }
    },
    Ke = [],
    Re = {},
    j = class r {
        constructor(e, t) {
            (this.local = e.length ? e : Ke), (this.children = t.length ? t : Ke);
        }
        static create(e, t) {
            return t.length ? Ht(t, e, 0, Re) : z;
        }
        find(e, t, n) {
            let i = [];
            return this.findInner(e ?? 0, t ?? 1e9, i, 0, n), i;
        }
        findInner(e, t, n, i, s) {
            for (let o = 0; o < this.local.length; o++) {
                let l = this.local[o];
                l.from <= t && l.to >= e && (!s || s(l.spec)) && n.push(l.copy(l.from + i, l.to + i));
            }
            for (let o = 0; o < this.children.length; o += 3)
                if (this.children[o] < t && this.children[o + 1] > e) {
                    let l = this.children[o] + 1;
                    this.children[o + 2].findInner(e - l, t - l, n, i + l, s);
                }
        }
        map(e, t, n) {
            return this == z || e.maps.length == 0 ? this : this.mapInner(e, t, 0, 0, n || Re);
        }
        mapInner(e, t, n, i, s) {
            let o;
            for (let l = 0; l < this.local.length; l++) {
                let a = this.local[l].map(e, n, i);
                a && a.type.valid(t, a) ? (o || (o = [])).push(a) : s.onRemove && s.onRemove(this.local[l].spec);
            }
            return this.children.length ? Al(this.children, o || [], e, t, n, i, s) : o ? new r(o.sort(ze), Ke) : z;
        }
        add(e, t) {
            return t.length ? (this == z ? r.create(e, t) : this.addInner(e, t, 0)) : this;
        }
        addInner(e, t, n) {
            let i,
                s = 0;
            e.forEach((l, a) => {
                let f = a + n,
                    c;
                if ((c = ds(t, l, f))) {
                    for (i || (i = this.children.slice()); s < i.length && i[s] < a; ) s += 3;
                    i[s] == a
                        ? (i[s + 2] = i[s + 2].addInner(l, c, f + 1))
                        : i.splice(s, 0, a, a + l.nodeSize, Ht(c, l, f + 1, Re)),
                        (s += 3);
                }
            });
            let o = us(s ? ps(t) : t, -n);
            for (let l = 0; l < o.length; l++) o[l].type.valid(e, o[l]) || o.splice(l--, 1);
            return new r(o.length ? this.local.concat(o).sort(ze) : this.local, i || this.children);
        }
        remove(e) {
            return e.length == 0 || this == z ? this : this.removeInner(e, 0);
        }
        removeInner(e, t) {
            let n = this.children,
                i = this.local;
            for (let s = 0; s < n.length; s += 3) {
                let o,
                    l = n[s] + t,
                    a = n[s + 1] + t;
                for (let c = 0, h; c < e.length; c++)
                    (h = e[c]) && h.from > l && h.to < a && ((e[c] = null), (o || (o = [])).push(h));
                if (!o) continue;
                n == this.children && (n = this.children.slice());
                let f = n[s + 2].removeInner(o, l + 1);
                f != z ? (n[s + 2] = f) : (n.splice(s, 3), (s -= 3));
            }
            if (i.length) {
                for (let s = 0, o; s < e.length; s++)
                    if ((o = e[s]))
                        for (let l = 0; l < i.length; l++)
                            i[l].eq(o, t) && (i == this.local && (i = this.local.slice()), i.splice(l--, 1));
            }
            return n == this.children && i == this.local ? this : i.length || n.length ? new r(i, n) : z;
        }
        forChild(e, t) {
            if (this == z) return this;
            if (t.isLeaf) return r.empty;
            let n, i;
            for (let l = 0; l < this.children.length; l += 3)
                if (this.children[l] >= e) {
                    this.children[l] == e && (n = this.children[l + 2]);
                    break;
                }
            let s = e + 1,
                o = s + t.content.size;
            for (let l = 0; l < this.local.length; l++) {
                let a = this.local[l];
                if (a.from < o && a.to > s && a.type instanceof Ie) {
                    let f = Math.max(s, a.from) - s,
                        c = Math.min(o, a.to) - s;
                    f < c && (i || (i = [])).push(a.copy(f, c));
                }
            }
            if (i) {
                let l = new r(i.sort(ze), Ke);
                return n ? new Kt([l, n]) : l;
            }
            return n || z;
        }
        eq(e) {
            if (this == e) return !0;
            if (!(e instanceof r) || this.local.length != e.local.length || this.children.length != e.children.length)
                return !1;
            for (let t = 0; t < this.local.length; t++) if (!this.local[t].eq(e.local[t])) return !1;
            for (let t = 0; t < this.children.length; t += 3)
                if (
                    this.children[t] != e.children[t] ||
                    this.children[t + 1] != e.children[t + 1] ||
                    !this.children[t + 2].eq(e.children[t + 2])
                )
                    return !1;
            return !0;
        }
        locals(e) {
            return _n(this.localsInner(e));
        }
        localsInner(e) {
            if (this == z) return Ke;
            if (e.inlineContent || !this.local.some(Ie.is)) return this.local;
            let t = [];
            for (let n = 0; n < this.local.length; n++) this.local[n].type instanceof Ie || t.push(this.local[n]);
            return t;
        }
        forEachSet(e) {
            e(this);
        }
    };
j.empty = new j([], []);
j.removeOverlap = _n;
var z = j.empty,
    Kt = class r {
        constructor(e) {
            this.members = e;
        }
        map(e, t) {
            let n = this.members.map((i) => i.map(e, t, Re));
            return r.from(n);
        }
        forChild(e, t) {
            if (t.isLeaf) return j.empty;
            let n = [];
            for (let i = 0; i < this.members.length; i++) {
                let s = this.members[i].forChild(e, t);
                s != z && (s instanceof r ? (n = n.concat(s.members)) : n.push(s));
            }
            return r.from(n);
        }
        eq(e) {
            if (!(e instanceof r) || e.members.length != this.members.length) return !1;
            for (let t = 0; t < this.members.length; t++) if (!this.members[t].eq(e.members[t])) return !1;
            return !0;
        }
        locals(e) {
            let t,
                n = !0;
            for (let i = 0; i < this.members.length; i++) {
                let s = this.members[i].localsInner(e);
                if (s.length)
                    if (!t) t = s;
                    else {
                        n && ((t = t.slice()), (n = !1));
                        for (let o = 0; o < s.length; o++) t.push(s[o]);
                    }
            }
            return t ? _n(n ? t : t.sort(ze)) : Ke;
        }
        static from(e) {
            switch (e.length) {
                case 0:
                    return z;
                case 1:
                    return e[0];
                default:
                    return new r(
                        e.every((t) => t instanceof j) ? e : e.reduce((t, n) => t.concat(n instanceof j ? n : n.members), []),
                    );
            }
        }
        forEachSet(e) {
            for (let t = 0; t < this.members.length; t++) this.members[t].forEachSet(e);
        }
    };
function Al(r, e, t, n, i, s, o) {
    let l = r.slice();
    for (let f = 0, c = s; f < t.maps.length; f++) {
        let h = 0;
        t.maps[f].forEach((u, p, d, m) => {
            let g = m - d - (p - u);
            for (let b = 0; b < l.length; b += 3) {
                let N = l[b + 1];
                if (N < 0 || u > N + c - h) continue;
                let B = l[b] + c - h;
                p >= B ? (l[b + 1] = u <= B ? -2 : -1) : u >= c && g && ((l[b] += g), (l[b + 1] += g));
            }
            h += g;
        }),
            (c = t.maps[f].map(c, -1));
    }
    let a = !1;
    for (let f = 0; f < l.length; f += 3)
        if (l[f + 1] < 0) {
            if (l[f + 1] == -2) {
                (a = !0), (l[f + 1] = -1);
                continue;
            }
            let c = t.map(r[f] + s),
                h = c - i;
            if (h < 0 || h >= n.content.size) {
                a = !0;
                continue;
            }
            let u = t.map(r[f + 1] + s, -1),
                p = u - i,
                { index: d, offset: m } = n.content.findIndex(h),
                g = n.maybeChild(d);
            if (g && m == h && m + g.nodeSize == p) {
                let b = l[f + 2].mapInner(t, g, c + 1, r[f] + s + 1, o);
                b != z ? ((l[f] = h), (l[f + 1] = p), (l[f + 2] = b)) : ((l[f + 1] = -2), (a = !0));
            } else a = !0;
        }
    if (a) {
        let f = Il(l, r, e, t, i, s, o),
            c = Ht(f, n, 0, o);
        e = c.local;
        for (let h = 0; h < l.length; h += 3) l[h + 1] < 0 && (l.splice(h, 3), (h -= 3));
        for (let h = 0, u = 0; h < c.children.length; h += 3) {
            let p = c.children[h];
            for (; u < l.length && l[u] < p; ) u += 3;
            l.splice(u, 0, c.children[h], c.children[h + 1], c.children[h + 2]);
        }
    }
    return new j(e.sort(ze), l);
}
function us(r, e) {
    if (!e || !r.length) return r;
    let t = [];
    for (let n = 0; n < r.length; n++) {
        let i = r[n];
        t.push(new ge(i.from + e, i.to + e, i.type));
    }
    return t;
}
function Il(r, e, t, n, i, s, o) {
    function l(a, f) {
        for (let c = 0; c < a.local.length; c++) {
            let h = a.local[c].map(n, i, f);
            h ? t.push(h) : o.onRemove && o.onRemove(a.local[c].spec);
        }
        for (let c = 0; c < a.children.length; c += 3) l(a.children[c + 2], a.children[c] + f + 1);
    }
    for (let a = 0; a < r.length; a += 3) r[a + 1] == -1 && l(r[a + 2], e[a] + s + 1);
    return t;
}
function ds(r, e, t) {
    if (e.isLeaf) return null;
    let n = t + e.nodeSize,
        i = null;
    for (let s = 0, o; s < r.length; s++) (o = r[s]) && o.from > t && o.to < n && ((i || (i = [])).push(o), (r[s] = null));
    return i;
}
function ps(r) {
    let e = [];
    for (let t = 0; t < r.length; t++) r[t] != null && e.push(r[t]);
    return e;
}
function Ht(r, e, t, n) {
    let i = [],
        s = !1;
    e.forEach((l, a) => {
        let f = ds(r, l, a + t);
        if (f) {
            s = !0;
            let c = Ht(f, l, t + a + 1, n);
            c != z && i.push(a, a + l.nodeSize, c);
        }
    });
    let o = us(s ? ps(r) : r, -t).sort(ze);
    for (let l = 0; l < o.length; l++) o[l].type.valid(e, o[l]) || (n.onRemove && n.onRemove(o[l].spec), o.splice(l--, 1));
    return o.length || i.length ? new j(o, i) : z;
}
function ze(r, e) {
    return r.from - e.from || r.to - e.to;
}
function _n(r) {
    let e = r;
    for (let t = 0; t < e.length - 1; t++) {
        let n = e[t];
        if (n.from != n.to)
            for (let i = t + 1; i < e.length; i++) {
                let s = e[i];
                if (s.from == n.from) {
                    s.to != n.to &&
                        (e == r && (e = r.slice()), (e[i] = s.copy(s.from, n.to)), Di(e, i + 1, s.copy(n.to, s.to)));
                    continue;
                } else {
                    s.from < n.to &&
                        (e == r && (e = r.slice()), (e[t] = n.copy(n.from, s.from)), Di(e, i, n.copy(s.from, n.to)));
                    break;
                }
            }
    }
    return e;
}
function Di(r, e, t) {
    for (; e < r.length && ze(t, r[e]) > 0; ) e++;
    r.splice(e, 0, t);
}
function Nn(r) {
    let e = [];
    return (
        r.someProp('decorations', (t) => {
            let n = t(r.state);
            n && n != z && e.push(n);
        }),
        r.cursorWrapper && e.push(j.create(r.state.doc, [r.cursorWrapper.deco])),
        Kt.from(e)
    );
}
var Rl = { childList: !0, characterData: !0, characterDataOldValue: !0, attributes: !0, attributeOldValue: !0, subtree: !0 },
    zl = J && pe <= 11,
    qn = class {
        constructor() {
            (this.anchorNode = null), (this.anchorOffset = 0), (this.focusNode = null), (this.focusOffset = 0);
        }
        set(e) {
            (this.anchorNode = e.anchorNode),
                (this.anchorOffset = e.anchorOffset),
                (this.focusNode = e.focusNode),
                (this.focusOffset = e.focusOffset);
        }
        clear() {
            this.anchorNode = this.focusNode = null;
        }
        eq(e) {
            return (
                e.anchorNode == this.anchorNode &&
                e.anchorOffset == this.anchorOffset &&
                e.focusNode == this.focusNode &&
                e.focusOffset == this.focusOffset
            );
        }
    },
    Kn = class {
        constructor(e, t) {
            (this.view = e),
                (this.handleDOMChange = t),
                (this.queue = []),
                (this.flushingSoon = -1),
                (this.observer = null),
                (this.currentSelection = new qn()),
                (this.onCharData = null),
                (this.suppressingSelectionUpdates = !1),
                (this.lastChangedTextNode = null),
                (this.observer =
                    window.MutationObserver &&
                    new window.MutationObserver((n) => {
                        for (let i = 0; i < n.length; i++) this.queue.push(n[i]);
                        J &&
                        pe <= 11 &&
                        n.some(
                            (i) =>
                                (i.type == 'childList' && i.removedNodes.length) ||
                                (i.type == 'characterData' && i.oldValue.length > i.target.nodeValue.length),
                        )
                            ? this.flushSoon()
                            : this.flush();
                    })),
                zl &&
                    (this.onCharData = (n) => {
                        this.queue.push({ target: n.target, type: 'characterData', oldValue: n.prevValue }), this.flushSoon();
                    }),
                (this.onSelectionChange = this.onSelectionChange.bind(this));
        }
        flushSoon() {
            this.flushingSoon < 0 &&
                (this.flushingSoon = window.setTimeout(() => {
                    (this.flushingSoon = -1), this.flush();
                }, 20));
        }
        forceFlush() {
            this.flushingSoon > -1 && (window.clearTimeout(this.flushingSoon), (this.flushingSoon = -1), this.flush());
        }
        start() {
            this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, Rl)),
                this.onCharData && this.view.dom.addEventListener('DOMCharacterDataModified', this.onCharData),
                this.connectSelection();
        }
        stop() {
            if (this.observer) {
                let e = this.observer.takeRecords();
                if (e.length) {
                    for (let t = 0; t < e.length; t++) this.queue.push(e[t]);
                    window.setTimeout(() => this.flush(), 20);
                }
                this.observer.disconnect();
            }
            this.onCharData && this.view.dom.removeEventListener('DOMCharacterDataModified', this.onCharData),
                this.disconnectSelection();
        }
        connectSelection() {
            this.view.dom.ownerDocument.addEventListener('selectionchange', this.onSelectionChange);
        }
        disconnectSelection() {
            this.view.dom.ownerDocument.removeEventListener('selectionchange', this.onSelectionChange);
        }
        suppressSelectionUpdates() {
            (this.suppressingSelectionUpdates = !0), setTimeout(() => (this.suppressingSelectionUpdates = !1), 50);
        }
        onSelectionChange() {
            if (bi(this.view)) {
                if (this.suppressingSelectionUpdates) return ie(this.view);
                if (J && pe <= 11 && !this.view.state.selection.empty) {
                    let e = this.view.domSelectionRange();
                    if (e.focusNode && Pe(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset)) return this.flushSoon();
                }
                this.flush();
            }
        }
        setCurSelection() {
            this.currentSelection.set(this.view.domSelectionRange());
        }
        ignoreSelectionChange(e) {
            if (!e.focusNode) return !0;
            let t = new Set(),
                n;
            for (let s = e.focusNode; s; s = dt(s)) t.add(s);
            for (let s = e.anchorNode; s; s = dt(s))
                if (t.has(s)) {
                    n = s;
                    break;
                }
            let i = n && this.view.docView.nearestDesc(n);
            if (i && i.ignoreMutation({ type: 'selection', target: n.nodeType == 3 ? n.parentNode : n }))
                return this.setCurSelection(), !0;
        }
        pendingRecords() {
            if (this.observer) for (let e of this.observer.takeRecords()) this.queue.push(e);
            return this.queue;
        }
        flush() {
            let { view: e } = this;
            if (!e.docView || this.flushingSoon > -1) return;
            let t = this.pendingRecords();
            t.length && (this.queue = []);
            let n = e.domSelectionRange(),
                i =
                    !this.suppressingSelectionUpdates &&
                    !this.currentSelection.eq(n) &&
                    bi(e) &&
                    !this.ignoreSelectionChange(n),
                s = -1,
                o = -1,
                l = !1,
                a = [];
            if (e.editable)
                for (let c = 0; c < t.length; c++) {
                    let h = this.registerMutation(t[c], a);
                    h &&
                        ((s = s < 0 ? h.from : Math.min(h.from, s)),
                        (o = o < 0 ? h.to : Math.max(h.to, o)),
                        h.typeOver && (l = !0));
                }
            if (G && a.length) {
                let c = a.filter((h) => h.nodeName == 'BR');
                if (c.length == 2) {
                    let [h, u] = c;
                    h.parentNode && h.parentNode.parentNode == u.parentNode ? u.remove() : h.remove();
                } else {
                    let { focusNode: h } = this.currentSelection;
                    for (let u of c) {
                        let p = u.parentNode;
                        p && p.nodeName == 'LI' && (!h || Fl(e, h) != p) && u.remove();
                    }
                }
            }
            let f = null;
            s < 0 &&
            i &&
            e.input.lastFocus > Date.now() - 200 &&
            Math.max(e.input.lastTouch, e.input.lastClick.time) < Date.now() - 300 &&
            jt(n) &&
            (f = jn(e)) &&
            f.eq(k.near(e.state.doc.resolve(0), 1))
                ? ((e.input.lastFocus = 0), ie(e), this.currentSelection.set(n), e.scrollToSelection())
                : (s > -1 || i) &&
                  (s > -1 && (e.docView.markDirty(s, o), Pl(e)),
                  this.handleDOMChange(s, o, l, a),
                  e.docView && e.docView.dirty ? e.updateState(e.state) : this.currentSelection.eq(n) || ie(e),
                  this.currentSelection.set(n));
        }
        registerMutation(e, t) {
            if (t.indexOf(e.target) > -1) return null;
            let n = this.view.docView.nearestDesc(e.target);
            if (
                (e.type == 'attributes' &&
                    (n == this.view.docView ||
                        e.attributeName == 'contenteditable' ||
                        (e.attributeName == 'style' && !e.oldValue && !e.target.getAttribute('style')))) ||
                !n ||
                n.ignoreMutation(e)
            )
                return null;
            if (e.type == 'childList') {
                for (let c = 0; c < e.addedNodes.length; c++) {
                    let h = e.addedNodes[c];
                    t.push(h), h.nodeType == 3 && (this.lastChangedTextNode = h);
                }
                if (n.contentDOM && n.contentDOM != n.dom && !n.contentDOM.contains(e.target))
                    return { from: n.posBefore, to: n.posAfter };
                let i = e.previousSibling,
                    s = e.nextSibling;
                if (J && pe <= 11 && e.addedNodes.length)
                    for (let c = 0; c < e.addedNodes.length; c++) {
                        let { previousSibling: h, nextSibling: u } = e.addedNodes[c];
                        (!h || Array.prototype.indexOf.call(e.addedNodes, h) < 0) && (i = h),
                            (!u || Array.prototype.indexOf.call(e.addedNodes, u) < 0) && (s = u);
                    }
                let o = i && i.parentNode == e.target ? A(i) + 1 : 0,
                    l = n.localPosFromDOM(e.target, o, -1),
                    a = s && s.parentNode == e.target ? A(s) : e.target.childNodes.length,
                    f = n.localPosFromDOM(e.target, a, 1);
                return { from: l, to: f };
            } else
                return e.type == 'attributes'
                    ? { from: n.posAtStart - n.border, to: n.posAtEnd + n.border }
                    : ((this.lastChangedTextNode = e.target),
                      { from: n.posAtStart, to: n.posAtEnd, typeOver: e.target.nodeValue == e.oldValue });
        }
    },
    Ti = new WeakMap(),
    Ei = !1;
function Pl(r) {
    if (!Ti.has(r) && (Ti.set(r, null), ['normal', 'nowrap', 'pre-line'].indexOf(getComputedStyle(r.dom).whiteSpace) !== -1)) {
        if (((r.requiresGeckoHackNode = G), Ei)) return;
        console.warn(
            "ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package.",
        ),
            (Ei = !0);
    }
}
function Ai(r, e) {
    let t = e.startContainer,
        n = e.startOffset,
        i = e.endContainer,
        s = e.endOffset,
        o = r.domAtPos(r.state.selection.anchor);
    return (
        Pe(o.node, o.offset, i, s) && ([t, n, i, s] = [i, s, t, n]),
        { anchorNode: t, anchorOffset: n, focusNode: i, focusOffset: s }
    );
}
function Bl(r, e) {
    if (e.getComposedRanges) {
        let i = e.getComposedRanges(r.root)[0];
        if (i) return Ai(r, i);
    }
    let t;
    function n(i) {
        i.preventDefault(), i.stopImmediatePropagation(), (t = i.getTargetRanges()[0]);
    }
    return (
        r.dom.addEventListener('beforeinput', n, !0),
        document.execCommand('indent'),
        r.dom.removeEventListener('beforeinput', n, !0),
        t ? Ai(r, t) : null
    );
}
function Fl(r, e) {
    for (let t = e.parentNode; t && t != r.dom; t = t.parentNode) {
        let n = r.docView.nearestDesc(t, !0);
        if (n && n.node.isBlock) return t;
    }
    return null;
}
function vl(r, e, t) {
    let { node: n, fromOffset: i, toOffset: s, from: o, to: l } = r.docView.parseRange(e, t),
        a = r.domSelectionRange(),
        f,
        c = a.anchorNode;
    if (
        (c &&
            r.dom.contains(c.nodeType == 1 ? c : c.parentNode) &&
            ((f = [{ node: c, offset: a.anchorOffset }]), jt(a) || f.push({ node: a.focusNode, offset: a.focusOffset })),
        P && r.input.lastKeyCode === 8)
    )
        for (let g = s; g > i; g--) {
            let b = n.childNodes[g - 1],
                N = b.pmViewDesc;
            if (b.nodeName == 'BR' && !N) {
                s = g;
                break;
            }
            if (!N || N.size) break;
        }
    let h = r.state.doc,
        u = r.someProp('domParser') || Qe.fromSchema(r.state.schema),
        p = h.resolve(o),
        d = null,
        m = u.parse(n, {
            topNode: p.parent,
            topMatch: p.parent.contentMatchAt(p.index()),
            topOpen: !0,
            from: i,
            to: s,
            preserveWhitespace: p.parent.type.whitespace == 'pre' ? 'full' : !0,
            findPositions: f,
            ruleFromNode: Vl,
            context: p,
        });
    if (f && f[0].pos != null) {
        let g = f[0].pos,
            b = f[1] && f[1].pos;
        b == null && (b = g), (d = { anchor: g + o, head: b + o });
    }
    return { doc: m, sel: d, from: o, to: l };
}
function Vl(r) {
    let e = r.pmViewDesc;
    if (e) return e.parseRule();
    if (r.nodeName == 'BR' && r.parentNode) {
        if (F && /^(ul|ol)$/i.test(r.parentNode.nodeName)) {
            let t = document.createElement('div');
            return t.appendChild(document.createElement('li')), { skip: t };
        } else if (r.parentNode.lastChild == r || (F && /^(tr|table)$/i.test(r.parentNode.nodeName))) return { ignore: !0 };
    } else if (r.nodeName == 'IMG' && r.getAttribute('mark-placeholder')) return { ignore: !0 };
    return null;
}
var Ll =
    /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
function Jl(r, e, t, n, i) {
    let s = r.input.compositionPendingChanges || (r.composing ? r.input.compositionID : 0);
    if (((r.input.compositionPendingChanges = 0), e < 0)) {
        let M = r.input.lastSelectionTime > Date.now() - 50 ? r.input.lastSelectionOrigin : null,
            ae = jn(r, M);
        if (ae && !r.state.selection.eq(ae)) {
            if (
                P &&
                U &&
                r.input.lastKeyCode === 13 &&
                Date.now() - 100 < r.input.lastKeyCodeTime &&
                r.someProp('handleKeyDown', (Es) => Es(r, Te(13, 'Enter')))
            )
                return;
            let kt = r.state.tr.setSelection(ae);
            M == 'pointer' ? kt.setMeta('pointer', !0) : M == 'key' && kt.scrollIntoView(),
                s && kt.setMeta('composition', s),
                r.dispatch(kt);
        }
        return;
    }
    let o = r.state.doc.resolve(e),
        l = o.sharedDepth(t);
    (e = o.before(l + 1)), (t = r.state.doc.resolve(t).after(l + 1));
    let a = r.state.selection,
        f = vl(r, e, t),
        c = r.state.doc,
        h = c.slice(f.from, f.to),
        u,
        p;
    r.input.lastKeyCode === 8 && Date.now() - 100 < r.input.lastKeyCodeTime
        ? ((u = r.state.selection.to), (p = 'end'))
        : ((u = r.state.selection.from), (p = 'start')),
        (r.input.lastKeyCode = null);
    let d = ql(h.content, f.doc.content, f.from, u, p);
    if (
        (d && r.input.domChangeCount++,
        ((je && r.input.lastIOSEnter > Date.now() - 225) || U) &&
            i.some((M) => M.nodeType == 1 && !Ll.test(M.nodeName)) &&
            (!d || d.endA >= d.endB) &&
            r.someProp('handleKeyDown', (M) => M(r, Te(13, 'Enter'))))
    ) {
        r.input.lastIOSEnter = 0;
        return;
    }
    if (!d)
        if (
            n &&
            a instanceof O &&
            !a.empty &&
            a.$head.sameParent(a.$anchor) &&
            !r.composing &&
            !(f.sel && f.sel.anchor != f.sel.head)
        )
            d = { start: a.from, endA: a.to, endB: a.to };
        else {
            if (f.sel) {
                let M = Ii(r, r.state.doc, f.sel);
                if (M && !M.eq(r.state.selection)) {
                    let ae = r.state.tr.setSelection(M);
                    s && ae.setMeta('composition', s), r.dispatch(ae);
                }
            }
            return;
        }
    r.state.selection.from < r.state.selection.to &&
        d.start == d.endB &&
        r.state.selection instanceof O &&
        (d.start > r.state.selection.from && d.start <= r.state.selection.from + 2 && r.state.selection.from >= f.from
            ? (d.start = r.state.selection.from)
            : d.endA < r.state.selection.to &&
              d.endA >= r.state.selection.to - 2 &&
              r.state.selection.to <= f.to &&
              ((d.endB += r.state.selection.to - d.endA), (d.endA = r.state.selection.to))),
        J &&
            pe <= 11 &&
            d.endB == d.start + 1 &&
            d.endA == d.start &&
            d.start > f.from &&
            f.doc.textBetween(d.start - f.from - 1, d.start - f.from + 1) == ' \xA0' &&
            (d.start--, d.endA--, d.endB--);
    let m = f.doc.resolveNoCache(d.start - f.from),
        g = f.doc.resolveNoCache(d.endB - f.from),
        b = c.resolve(d.start),
        N = m.sameParent(g) && m.parent.inlineContent && b.end() >= d.endA,
        B;
    if (
        ((je && r.input.lastIOSEnter > Date.now() - 225 && (!N || i.some((M) => M.nodeName == 'DIV' || M.nodeName == 'P'))) ||
            (!N &&
                m.pos < f.doc.content.size &&
                !m.sameParent(g) &&
                (B = k.findFrom(f.doc.resolve(m.pos + 1), 1, !0)) &&
                B.head == g.pos)) &&
        r.someProp('handleKeyDown', (M) => M(r, Te(13, 'Enter')))
    ) {
        r.input.lastIOSEnter = 0;
        return;
    }
    if (
        r.state.selection.anchor > d.start &&
        $l(c, d.start, d.endA, m, g) &&
        r.someProp('handleKeyDown', (M) => M(r, Te(8, 'Backspace')))
    ) {
        U && P && r.domObserver.suppressSelectionUpdates();
        return;
    }
    P && U && d.endB == d.start && (r.input.lastAndroidDelete = Date.now()),
        U &&
            !N &&
            m.start() != g.start() &&
            g.parentOffset == 0 &&
            m.depth == g.depth &&
            f.sel &&
            f.sel.anchor == f.sel.head &&
            f.sel.head == d.endA &&
            ((d.endB -= 2),
            (g = f.doc.resolveNoCache(d.endB - f.from)),
            setTimeout(() => {
                r.someProp('handleKeyDown', function (M) {
                    return M(r, Te(13, 'Enter'));
                });
            }, 20));
    let Y = d.start,
        xe = d.endA,
        W,
        _t,
        St;
    if (N) {
        if (m.pos == g.pos)
            J && pe <= 11 && m.parentOffset == 0 && (r.domObserver.suppressSelectionUpdates(), setTimeout(() => ie(r), 20)),
                (W = r.state.tr.delete(Y, xe)),
                (_t = c.resolve(d.start).marksAcross(c.resolve(d.endA)));
        else if (
            d.endA == d.endB &&
            (St = Wl(
                m.parent.content.cut(m.parentOffset, g.parentOffset),
                b.parent.content.cut(b.parentOffset, d.endA - b.start()),
            ))
        )
            (W = r.state.tr), St.type == 'add' ? W.addMark(Y, xe, St.mark) : W.removeMark(Y, xe, St.mark);
        else if (m.parent.child(m.index()).isText && m.index() == g.index() - (g.textOffset ? 0 : 1)) {
            let M = m.parent.textBetween(m.parentOffset, g.parentOffset);
            if (r.someProp('handleTextInput', (ae) => ae(r, Y, xe, M))) return;
            W = r.state.tr.insertText(M, Y, xe);
        }
    }
    if ((W || (W = r.state.tr.replace(Y, xe, f.doc.slice(d.start - f.from, d.endB - f.from))), f.sel)) {
        let M = Ii(r, W.doc, f.sel);
        M &&
            !(
                (P &&
                    U &&
                    r.composing &&
                    M.empty &&
                    (d.start != d.endB || r.input.lastAndroidDelete < Date.now() - 100) &&
                    (M.head == Y || M.head == W.mapping.map(xe) - 1)) ||
                (J && M.empty && M.head == Y)
            ) &&
            W.setSelection(M);
    }
    _t && W.ensureMarks(_t), s && W.setMeta('composition', s), r.dispatch(W.scrollIntoView());
}
function Ii(r, e, t) {
    return Math.max(t.anchor, t.head) > e.content.size ? null : Un(r, e.resolve(t.anchor), e.resolve(t.head));
}
function Wl(r, e) {
    let t = r.firstChild.marks,
        n = e.firstChild.marks,
        i = t,
        s = n,
        o,
        l,
        a;
    for (let c = 0; c < n.length; c++) i = n[c].removeFromSet(i);
    for (let c = 0; c < t.length; c++) s = t[c].removeFromSet(s);
    if (i.length == 1 && s.length == 0) (l = i[0]), (o = 'add'), (a = (c) => c.mark(l.addToSet(c.marks)));
    else if (i.length == 0 && s.length == 1) (l = s[0]), (o = 'remove'), (a = (c) => c.mark(l.removeFromSet(c.marks)));
    else return null;
    let f = [];
    for (let c = 0; c < e.childCount; c++) f.push(a(e.child(c)));
    if (y.from(f).eq(r)) return { mark: l, type: o };
}
function $l(r, e, t, n, i) {
    if (t - e <= i.pos - n.pos || wn(n, !0, !1) < i.pos) return !1;
    let s = r.resolve(e);
    if (!n.parent.isTextblock) {
        let l = s.nodeAfter;
        return l != null && t == e + l.nodeSize;
    }
    if (s.parentOffset < s.parent.content.size || !s.parent.isTextblock) return !1;
    let o = r.resolve(wn(s, !0, !0));
    return !o.parent.isTextblock || o.pos > t || wn(o, !0, !1) < t
        ? !1
        : n.parent.content.cut(n.parentOffset).eq(o.parent.content);
}
function wn(r, e, t) {
    let n = r.depth,
        i = e ? r.end() : r.pos;
    for (; n > 0 && (e || r.indexAfter(n) == r.node(n).childCount); ) n--, i++, (e = !1);
    if (t) {
        let s = r.node(n).maybeChild(r.indexAfter(n));
        for (; s && !s.isLeaf; ) (s = s.firstChild), i++;
    }
    return i;
}
function ql(r, e, t, n, i) {
    let s = r.findDiffStart(e, t);
    if (s == null) return null;
    let { a: o, b: l } = r.findDiffEnd(e, t + r.size, t + e.size);
    if (i == 'end') {
        let a = Math.max(0, s - Math.min(o, l));
        n -= o + a - s;
    }
    if (o < s && r.size < e.size) {
        let a = n <= s && n >= o ? s - n : 0;
        (s -= a), s && s < e.size && Ri(e.textBetween(s - 1, s + 1)) && (s += a ? 1 : -1), (l = s + (l - o)), (o = s);
    } else if (l < s) {
        let a = n <= s && n >= l ? s - n : 0;
        (s -= a), s && s < r.size && Ri(r.textBetween(s - 1, s + 1)) && (s += a ? 1 : -1), (o = s + (o - l)), (l = s);
    }
    return { start: s, endA: o, endB: l };
}
function Ri(r) {
    if (r.length != 2) return !1;
    let e = r.charCodeAt(0),
        t = r.charCodeAt(1);
    return e >= 56320 && e <= 57343 && t >= 55296 && t <= 56319;
}
var rf = Gn,
    sf = Yn,
    of = pt,
    zi = class {
        constructor(e, t) {
            (this._root = null),
                (this.focused = !1),
                (this.trackWrites = null),
                (this.mounted = !1),
                (this.markCursor = null),
                (this.cursorWrapper = null),
                (this.lastSelectedViewDesc = void 0),
                (this.input = new Ln()),
                (this.prevDirectPlugins = []),
                (this.pluginViews = []),
                (this.requiresGeckoHackNode = !1),
                (this.dragging = null),
                (this._props = t),
                (this.state = t.state),
                (this.directPlugins = t.plugins || []),
                this.directPlugins.forEach(Vi),
                (this.dispatch = this.dispatch.bind(this)),
                (this.dom = (e && e.mount) || document.createElement('div')),
                e &&
                    (e.appendChild
                        ? e.appendChild(this.dom)
                        : typeof e == 'function'
                          ? e(this.dom)
                          : e.mount && (this.mounted = !0)),
                (this.editable = Fi(this)),
                Bi(this),
                (this.nodeViews = vi(this)),
                (this.docView = di(this.state.doc, Pi(this), Nn(this), this.dom, this)),
                (this.domObserver = new Kn(this, (n, i, s, o) => Jl(this, n, i, s, o))),
                this.domObserver.start(),
                dl(this),
                this.updatePluginViews();
        }
        get composing() {
            return this.input.composing;
        }
        get props() {
            if (this._props.state != this.state) {
                let e = this._props;
                this._props = {};
                for (let t in e) this._props[t] = e[t];
                this._props.state = this.state;
            }
            return this._props;
        }
        update(e) {
            e.handleDOMEvents != this._props.handleDOMEvents && Jn(this);
            let t = this._props;
            (this._props = e),
                e.plugins && (e.plugins.forEach(Vi), (this.directPlugins = e.plugins)),
                this.updateStateInner(e.state, t);
        }
        setProps(e) {
            let t = {};
            for (let n in this._props) t[n] = this._props[n];
            t.state = this.state;
            for (let n in e) t[n] = e[n];
            this.update(t);
        }
        updateState(e) {
            this.updateStateInner(e, this._props);
        }
        updateStateInner(e, t) {
            var n;
            let i = this.state,
                s = !1,
                o = !1;
            e.storedMarks && this.composing && (fs(this), (o = !0)), (this.state = e);
            let l = i.plugins != e.plugins || this._props.plugins != t.plugins;
            if (l || this._props.plugins != t.plugins || this._props.nodeViews != t.nodeViews) {
                let p = vi(this);
                Hl(p, this.nodeViews) && ((this.nodeViews = p), (s = !0));
            }
            (l || t.handleDOMEvents != this._props.handleDOMEvents) && Jn(this), (this.editable = Fi(this)), Bi(this);
            let a = Nn(this),
                f = Pi(this),
                c =
                    i.plugins != e.plugins && !i.doc.eq(e.doc)
                        ? 'reset'
                        : e.scrollToSelection > i.scrollToSelection
                          ? 'to selection'
                          : 'preserve',
                h = s || !this.docView.matchesNode(e.doc, f, a);
            (h || !e.selection.eq(i.selection)) && (o = !0);
            let u = c == 'preserve' && o && this.dom.style.overflowAnchor == null && Io(this);
            if (o) {
                this.domObserver.stop();
                let p =
                    h &&
                    (J || P) &&
                    !this.composing &&
                    !i.selection.empty &&
                    !e.selection.empty &&
                    Kl(i.selection, e.selection);
                if (h) {
                    let d = P ? (this.trackWrites = this.domSelectionRange().focusNode) : null;
                    this.composing && (this.input.compositionNode = Nl(this)),
                        (s || !this.docView.update(e.doc, f, a, this)) &&
                            (this.docView.updateOuterDeco(f),
                            this.docView.destroy(),
                            (this.docView = di(e.doc, f, a, this.dom, this))),
                        d && !this.trackWrites && (p = !0);
                }
                p || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelectionRange()) && Qo(this))
                    ? ie(this, p)
                    : (Zi(this, e.selection), this.domObserver.setCurSelection()),
                    this.domObserver.start();
            }
            this.updatePluginViews(i),
                !((n = this.dragging) === null || n === void 0) &&
                    n.node &&
                    !i.doc.eq(e.doc) &&
                    this.updateDraggedNode(this.dragging, i),
                c == 'reset' ? (this.dom.scrollTop = 0) : c == 'to selection' ? this.scrollToSelection() : u && Ro(u);
        }
        scrollToSelection() {
            let e = this.domSelectionRange().focusNode;
            if (!this.someProp('handleScrollToSelection', (t) => t(this)))
                if (this.state.selection instanceof S) {
                    let t = this.docView.domAfterPos(this.state.selection.from);
                    t.nodeType == 1 && li(this, t.getBoundingClientRect(), e);
                } else li(this, this.coordsAtPos(this.state.selection.head, 1), e);
        }
        destroyPluginViews() {
            let e;
            for (; (e = this.pluginViews.pop()); ) e.destroy && e.destroy();
        }
        updatePluginViews(e) {
            if (!e || e.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
                (this.prevDirectPlugins = this.directPlugins), this.destroyPluginViews();
                for (let t = 0; t < this.directPlugins.length; t++) {
                    let n = this.directPlugins[t];
                    n.spec.view && this.pluginViews.push(n.spec.view(this));
                }
                for (let t = 0; t < this.state.plugins.length; t++) {
                    let n = this.state.plugins[t];
                    n.spec.view && this.pluginViews.push(n.spec.view(this));
                }
            } else
                for (let t = 0; t < this.pluginViews.length; t++) {
                    let n = this.pluginViews[t];
                    n.update && n.update(this, e);
                }
        }
        updateDraggedNode(e, t) {
            let n = e.node,
                i = -1;
            if (this.state.doc.nodeAt(n.from) == n.node) i = n.from;
            else {
                let s = n.from + (this.state.doc.content.size - t.doc.content.size);
                (s > 0 && this.state.doc.nodeAt(s)) == n.node && (i = s);
            }
            this.dragging = new $t(e.slice, e.move, i < 0 ? void 0 : S.create(this.state.doc, i));
        }
        someProp(e, t) {
            let n = this._props && this._props[e],
                i;
            if (n != null && (i = t ? t(n) : n)) return i;
            for (let o = 0; o < this.directPlugins.length; o++) {
                let l = this.directPlugins[o].props[e];
                if (l != null && (i = t ? t(l) : l)) return i;
            }
            let s = this.state.plugins;
            if (s)
                for (let o = 0; o < s.length; o++) {
                    let l = s[o].props[e];
                    if (l != null && (i = t ? t(l) : l)) return i;
                }
        }
        hasFocus() {
            if (J) {
                let e = this.root.activeElement;
                if (e == this.dom) return !0;
                if (!e || !this.dom.contains(e)) return !1;
                for (; e && this.dom != e && this.dom.contains(e); ) {
                    if (e.contentEditable == 'false') return !1;
                    e = e.parentElement;
                }
                return !0;
            }
            return this.root.activeElement == this.dom;
        }
        focus() {
            this.domObserver.stop(), this.editable && zo(this.dom), ie(this), this.domObserver.start();
        }
        get root() {
            let e = this._root;
            if (e == null) {
                for (let t = this.dom.parentNode; t; t = t.parentNode)
                    if (t.nodeType == 9 || (t.nodeType == 11 && t.host))
                        return (
                            t.getSelection || (Object.getPrototypeOf(t).getSelection = () => t.ownerDocument.getSelection()),
                            (this._root = t)
                        );
            }
            return e || document;
        }
        updateRoot() {
            this._root = null;
        }
        posAtCoords(e) {
            return Vo(this, e);
        }
        coordsAtPos(e, t = 1) {
            return Hi(this, e, t);
        }
        domAtPos(e, t = 0) {
            return this.docView.domFromPos(e, t);
        }
        nodeDOM(e) {
            let t = this.docView.descAt(e);
            return t ? t.nodeDOM : null;
        }
        posAtDOM(e, t, n = -1) {
            let i = this.docView.posFromDOM(e, t, n);
            if (i == null) throw new RangeError('DOM position not inside the editor');
            return i;
        }
        endOfTextblock(e, t) {
            return qo(this, t || this.state, e);
        }
        pasteHTML(e, t) {
            return gt(this, '', e, !1, t || new ClipboardEvent('paste'));
        }
        pasteText(e, t) {
            return gt(this, e, null, !0, t || new ClipboardEvent('paste'));
        }
        destroy() {
            this.docView &&
                (pl(this),
                this.destroyPluginViews(),
                this.mounted
                    ? (this.docView.update(this.state.doc, [], Nn(this), this), (this.dom.textContent = ''))
                    : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom),
                this.docView.destroy(),
                (this.docView = null),
                So());
        }
        get isDestroyed() {
            return this.docView == null;
        }
        dispatchEvent(e) {
            return gl(this, e);
        }
        dispatch(e) {
            let t = this._props.dispatchTransaction;
            t ? t.call(this, e) : this.updateState(this.state.apply(e));
        }
        domSelectionRange() {
            let e = this.domSelection();
            return e
                ? (F && this.root.nodeType === 11 && No(this.dom.ownerDocument) == this.dom && Bl(this, e)) || e
                : { focusNode: null, focusOffset: 0, anchorNode: null, anchorOffset: 0 };
        }
        domSelection() {
            return this.root.getSelection();
        }
    };
function Pi(r) {
    let e = Object.create(null);
    return (
        (e.class = 'ProseMirror'),
        (e.contenteditable = String(r.editable)),
        r.someProp('attributes', (t) => {
            if ((typeof t == 'function' && (t = t(r.state)), t))
                for (let n in t)
                    n == 'class'
                        ? (e.class += ' ' + t[n])
                        : n == 'style'
                          ? (e.style = (e.style ? e.style + ';' : '') + t[n])
                          : !e[n] && n != 'contenteditable' && n != 'nodeName' && (e[n] = String(t[n]));
        }),
        e.translate || (e.translate = 'no'),
        [ge.node(0, r.state.doc.content.size, e)]
    );
}
function Bi(r) {
    if (r.markCursor) {
        let e = document.createElement('img');
        (e.className = 'ProseMirror-separator'),
            e.setAttribute('mark-placeholder', 'true'),
            e.setAttribute('alt', ''),
            (r.cursorWrapper = { dom: e, deco: ge.widget(r.state.selection.from, e, { raw: !0, marks: r.markCursor }) });
    } else r.cursorWrapper = null;
}
function Fi(r) {
    return !r.someProp('editable', (e) => e(r.state) === !1);
}
function Kl(r, e) {
    let t = Math.min(r.$anchor.sharedDepth(r.head), e.$anchor.sharedDepth(e.head));
    return r.$anchor.start(t) != e.$anchor.start(t);
}
function vi(r) {
    let e = Object.create(null);
    function t(n) {
        for (let i in n) Object.prototype.hasOwnProperty.call(e, i) || (e[i] = n[i]);
    }
    return r.someProp('nodeViews', t), r.someProp('markViews', t), e;
}
function Hl(r, e) {
    let t = 0,
        n = 0;
    for (let i in r) {
        if (r[i] != e[i]) return !0;
        t++;
    }
    for (let i in e) n++;
    return t != n;
}
function Vi(r) {
    if (r.spec.state || r.spec.filterTransaction || r.spec.appendTransaction)
        throw new RangeError('Plugins passed directly to the view must not have a state component');
}
var se = {
        8: 'Backspace',
        9: 'Tab',
        10: 'Enter',
        12: 'NumLock',
        13: 'Enter',
        16: 'Shift',
        17: 'Control',
        18: 'Alt',
        20: 'CapsLock',
        27: 'Escape',
        32: ' ',
        33: 'PageUp',
        34: 'PageDown',
        35: 'End',
        36: 'Home',
        37: 'ArrowLeft',
        38: 'ArrowUp',
        39: 'ArrowRight',
        40: 'ArrowDown',
        44: 'PrintScreen',
        45: 'Insert',
        46: 'Delete',
        59: ';',
        61: '=',
        91: 'Meta',
        92: 'Meta',
        106: '*',
        107: '+',
        108: ',',
        109: '-',
        110: '.',
        111: '/',
        144: 'NumLock',
        145: 'ScrollLock',
        160: 'Shift',
        161: 'Shift',
        162: 'Control',
        163: 'Control',
        164: 'Alt',
        165: 'Alt',
        173: '-',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: "'",
    },
    Yt = {
        48: ')',
        49: '!',
        50: '@',
        51: '#',
        52: '$',
        53: '%',
        54: '^',
        55: '&',
        56: '*',
        57: '(',
        59: ':',
        61: '+',
        173: '_',
        186: ':',
        187: '+',
        188: '<',
        189: '_',
        190: '>',
        191: '?',
        192: '~',
        219: '{',
        220: '|',
        221: '}',
        222: '"',
    },
    jl = typeof navigator < 'u' && /Mac/.test(navigator.platform),
    Ul = typeof navigator < 'u' && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
for (w = 0; w < 10; w++) se[48 + w] = se[96 + w] = String(w);
var w;
for (w = 1; w <= 24; w++) se[w + 111] = 'F' + w;
var w;
for (w = 65; w <= 90; w++) (se[w] = String.fromCharCode(w + 32)), (Yt[w] = String.fromCharCode(w));
var w;
for (Gt in se) Yt.hasOwnProperty(Gt) || (Yt[Gt] = se[Gt]);
var Gt;
function ms(r) {
    var e =
            (jl && r.metaKey && r.shiftKey && !r.ctrlKey && !r.altKey) ||
            (Ul && r.shiftKey && r.key && r.key.length == 1) ||
            r.key == 'Unidentified',
        t = (!e && r.key) || (r.shiftKey ? Yt : se)[r.keyCode] || r.key || 'Unidentified';
    return (
        t == 'Esc' && (t = 'Escape'),
        t == 'Del' && (t = 'Delete'),
        t == 'Left' && (t = 'ArrowLeft'),
        t == 'Up' && (t = 'ArrowUp'),
        t == 'Right' && (t = 'ArrowRight'),
        t == 'Down' && (t = 'ArrowDown'),
        t
    );
}
var Gl = typeof navigator < 'u' ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : !1;
function Yl(r) {
    let e = r.split(/-(?!$)/),
        t = e[e.length - 1];
    t == 'Space' && (t = ' ');
    let n, i, s, o;
    for (let l = 0; l < e.length - 1; l++) {
        let a = e[l];
        if (/^(cmd|meta|m)$/i.test(a)) o = !0;
        else if (/^a(lt)?$/i.test(a)) n = !0;
        else if (/^(c|ctrl|control)$/i.test(a)) i = !0;
        else if (/^s(hift)?$/i.test(a)) s = !0;
        else if (/^mod$/i.test(a)) Gl ? (o = !0) : (i = !0);
        else throw new Error('Unrecognized modifier name: ' + a);
    }
    return n && (t = 'Alt-' + t), i && (t = 'Ctrl-' + t), o && (t = 'Meta-' + t), s && (t = 'Shift-' + t), t;
}
function Xl(r) {
    let e = Object.create(null);
    for (let t in r) e[Yl(t)] = r[t];
    return e;
}
function er(r, e, t = !0) {
    return (
        e.altKey && (r = 'Alt-' + r),
        e.ctrlKey && (r = 'Ctrl-' + r),
        e.metaKey && (r = 'Meta-' + r),
        t && e.shiftKey && (r = 'Shift-' + r),
        r
    );
}
function hf(r) {
    return new We({ props: { handleKeyDown: Zl(r) } });
}
function Zl(r) {
    let e = Xl(r);
    return function (t, n) {
        let i = ms(n),
            s,
            o = e[er(i, n)];
        if (o && o(t.state, t.dispatch, t)) return !0;
        if (i.length == 1 && i != ' ') {
            if (n.shiftKey) {
                let l = e[er(i, n, !1)];
                if (l && l(t.state, t.dispatch, t)) return !0;
            }
            if ((n.shiftKey || n.altKey || n.metaKey || i.charCodeAt(0) > 127) && (s = se[n.keyCode]) && s != i) {
                let l = e[er(s, n)];
                if (l && l(t.state, t.dispatch, t)) return !0;
            }
        }
        return !1;
    };
}
var Ql = ['p', 0],
    _l = ['blockquote', 0],
    ea = ['hr'],
    ta = ['pre', ['code', 0]],
    na = ['br'],
    ra = {
        doc: { content: 'block+' },
        paragraph: {
            content: 'inline*',
            group: 'block',
            parseDOM: [{ tag: 'p' }],
            toDOM() {
                return Ql;
            },
        },
        blockquote: {
            content: 'block+',
            group: 'block',
            defining: !0,
            parseDOM: [{ tag: 'blockquote' }],
            toDOM() {
                return _l;
            },
        },
        horizontal_rule: {
            group: 'block',
            parseDOM: [{ tag: 'hr' }],
            toDOM() {
                return ea;
            },
        },
        heading: {
            attrs: { level: { default: 1, validate: 'number' } },
            content: 'inline*',
            group: 'block',
            defining: !0,
            parseDOM: [
                { tag: 'h1', attrs: { level: 1 } },
                { tag: 'h2', attrs: { level: 2 } },
                { tag: 'h3', attrs: { level: 3 } },
                { tag: 'h4', attrs: { level: 4 } },
                { tag: 'h5', attrs: { level: 5 } },
                { tag: 'h6', attrs: { level: 6 } },
            ],
            toDOM(r) {
                return ['h' + r.attrs.level, 0];
            },
        },
        code_block: {
            content: 'text*',
            marks: '',
            group: 'block',
            code: !0,
            defining: !0,
            parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
            toDOM() {
                return ta;
            },
        },
        text: { group: 'inline' },
        image: {
            inline: !0,
            attrs: {
                src: { validate: 'string' },
                alt: { default: null, validate: 'string|null' },
                title: { default: null, validate: 'string|null' },
            },
            group: 'inline',
            draggable: !0,
            parseDOM: [
                {
                    tag: 'img[src]',
                    getAttrs(r) {
                        return { src: r.getAttribute('src'), title: r.getAttribute('title'), alt: r.getAttribute('alt') };
                    },
                },
            ],
            toDOM(r) {
                let { src: e, alt: t, title: n } = r.attrs;
                return ['img', { src: e, alt: t, title: n }];
            },
        },
        hard_break: {
            inline: !0,
            group: 'inline',
            selectable: !1,
            parseDOM: [{ tag: 'br' }],
            toDOM() {
                return na;
            },
        },
    },
    ia = ['em', 0],
    sa = ['strong', 0],
    oa = ['code', 0],
    la = {
        link: {
            attrs: { href: { validate: 'string' }, title: { default: null, validate: 'string|null' } },
            inclusive: !1,
            parseDOM: [
                {
                    tag: 'a[href]',
                    getAttrs(r) {
                        return { href: r.getAttribute('href'), title: r.getAttribute('title') };
                    },
                },
            ],
            toDOM(r) {
                let { href: e, title: t } = r.attrs;
                return ['a', { href: e, title: t }, 0];
            },
        },
        em: {
            parseDOM: [
                { tag: 'i' },
                { tag: 'em' },
                { style: 'font-style=italic' },
                { style: 'font-style=normal', clearMark: (r) => r.type.name == 'em' },
            ],
            toDOM() {
                return ia;
            },
        },
        strong: {
            parseDOM: [
                { tag: 'strong' },
                { tag: 'b', getAttrs: (r) => r.style.fontWeight != 'normal' && null },
                { style: 'font-weight=400', clearMark: (r) => r.type.name == 'strong' },
                { style: 'font-weight', getAttrs: (r) => /^(bold(er)?|[5-9]\d{2,})$/.test(r) && null },
            ],
            toDOM() {
                return sa;
            },
        },
        code: {
            parseDOM: [{ tag: 'code' }],
            toDOM() {
                return oa;
            },
        },
    },
    pf = new Tt({ nodes: ra, marks: la });
var aa = ['ol', 0],
    fa = ['ul', 0],
    ca = ['li', 0],
    ha = {
        attrs: { order: { default: 1, validate: 'number' } },
        parseDOM: [
            {
                tag: 'ol',
                getAttrs(r) {
                    return { order: r.hasAttribute('start') ? +r.getAttribute('start') : 1 };
                },
            },
        ],
        toDOM(r) {
            return r.attrs.order == 1 ? aa : ['ol', { start: r.attrs.order }, 0];
        },
    },
    ua = {
        parseDOM: [{ tag: 'ul' }],
        toDOM() {
            return fa;
        },
    },
    da = {
        parseDOM: [{ tag: 'li' }],
        toDOM() {
            return ca;
        },
        defining: !0,
    };
function tr(r, e) {
    let t = {};
    for (let n in r) t[n] = r[n];
    for (let n in e) t[n] = e[n];
    return t;
}
function bf(r, e, t) {
    return r.append({
        ordered_list: tr(ha, { content: 'list_item+', group: t }),
        bullet_list: tr(ua, { content: 'list_item+', group: t }),
        list_item: tr(da, { content: e }),
    });
}
function Sf(r, e = null) {
    return function (t, n) {
        let { $from: i, $to: s } = t.selection,
            o = i.blockRange(s);
        if (!o) return !1;
        let l = n ? t.tr : null;
        return pa(l, o, r, e) ? (n && n(l.scrollIntoView()), !0) : !1;
    };
}
function pa(r, e, t, n = null) {
    let i = !1,
        s = e,
        o = e.$from.doc;
    if (e.depth >= 2 && e.$from.node(e.depth - 1).type.compatibleContent(t) && e.startIndex == 0) {
        if (e.$from.index(e.depth - 1) == 0) return !1;
        let a = o.resolve(e.start - 2);
        (s = new Me(a, a, e.depth)),
            e.endIndex < e.parent.childCount && (e = new Me(e.$from, o.resolve(e.$to.end(e.depth)), e.depth)),
            (i = !0);
    }
    let l = Pt(s, t, n, e);
    return l ? (r && ma(r, e, l, i, t), !0) : !1;
}
function ma(r, e, t, n, i) {
    let s = y.empty;
    for (let c = t.length - 1; c >= 0; c--) s = y.from(t[c].type.create(t[c].attrs, s));
    r.step(new T(e.start - (n ? 2 : 0), e.end, e.start, e.end, new x(s, 0, 0), t.length, !0));
    let o = 0;
    for (let c = 0; c < t.length; c++) t[c].type == i && (o = c + 1);
    let l = t.length - o,
        a = e.start + t.length - (n ? 2 : 0),
        f = e.parent;
    for (let c = e.startIndex, h = e.endIndex, u = !0; c < h; c++, u = !1)
        !u && fe(r.doc, a, l) && (r.split(a, l), (a += 2 * l)), (a += f.child(c).nodeSize);
    return r;
}
function ga(r, e) {
    return function (t, n) {
        let { $from: i, $to: s, node: o } = t.selection;
        if ((o && o.isBlock) || i.depth < 2 || !i.sameParent(s)) return !1;
        let l = i.node(-1);
        if (l.type != r) return !1;
        if (i.parent.content.size == 0 && i.node(-1).childCount == i.indexAfter(-1)) {
            if (i.depth == 3 || i.node(-3).type != r || i.index(-2) != i.node(-2).childCount - 1) return !1;
            if (n) {
                let h = y.empty,
                    u = i.index(-1) ? 1 : i.index(-2) ? 2 : 3;
                for (let b = i.depth - u; b >= i.depth - 3; b--) h = y.from(i.node(b).copy(h));
                let p = i.indexAfter(-1) < i.node(-2).childCount ? 1 : i.indexAfter(-2) < i.node(-3).childCount ? 2 : 3;
                h = h.append(y.from(r.createAndFill()));
                let d = i.before(i.depth - (u - 1)),
                    m = t.tr.replace(d, i.after(-p), new x(h, 4 - u, 0)),
                    g = -1;
                m.doc.nodesBetween(d, m.doc.content.size, (b, N) => {
                    if (g > -1) return !1;
                    b.isTextblock && b.content.size == 0 && (g = N + 1);
                }),
                    g > -1 && m.setSelection(k.near(m.doc.resolve(g))),
                    n(m.scrollIntoView());
            }
            return !0;
        }
        let a = s.pos == i.end() ? l.contentMatchAt(0).defaultType : null,
            f = t.tr.delete(i.pos, s.pos),
            c = a ? [e ? { type: r, attrs: e } : null, { type: a }] : void 0;
        return fe(f.doc, i.pos, 2, c) ? (n && n(f.split(i.pos, 2, c).scrollIntoView()), !0) : !1;
    };
}
function kf(r, e) {
    let t = ga(r, e);
    return (n, i) =>
        t(
            n,
            i &&
                ((s) => {
                    let o = n.storedMarks || (n.selection.$to.parentOffset && n.selection.$from.marks());
                    o && s.ensureMarks(o), i(s);
                }),
        );
}
function Mf(r) {
    return function (e, t) {
        let { $from: n, $to: i } = e.selection,
            s = n.blockRange(i, (o) => o.childCount > 0 && o.firstChild.type == r);
        return s ? (t ? (n.node(s.depth - 1).type == r ? ya(e, t, r, s) : xa(e, t, s)) : !0) : !1;
    };
}
function ya(r, e, t, n) {
    let i = r.tr,
        s = n.end,
        o = n.$to.end(n.depth);
    s < o &&
        (i.step(new T(s - 1, o, s, o, new x(y.from(t.create(null, n.parent.copy())), 1, 0), 1, !0)),
        (n = new Me(i.doc.resolve(n.$from.pos), i.doc.resolve(o), n.depth)));
    let l = we(n);
    if (l == null) return !1;
    i.lift(n, l);
    let a = i.mapping.map(s, -1) - 1;
    return ce(i.doc, a) && i.join(a), e(i.scrollIntoView()), !0;
}
function xa(r, e, t) {
    let n = r.tr,
        i = t.parent;
    for (let p = t.end, d = t.endIndex - 1, m = t.startIndex; d > m; d--) (p -= i.child(d).nodeSize), n.delete(p - 1, p + 1);
    let s = n.doc.resolve(t.start),
        o = s.nodeAfter;
    if (n.mapping.map(t.end) != t.start + s.nodeAfter.nodeSize) return !1;
    let l = t.startIndex == 0,
        a = t.endIndex == i.childCount,
        f = s.node(-1),
        c = s.index(-1);
    if (!f.canReplace(c + (l ? 0 : 1), c + 1, o.content.append(a ? y.empty : y.from(i)))) return !1;
    let h = s.pos,
        u = h + o.nodeSize;
    return (
        n.step(
            new T(
                h - (l ? 1 : 0),
                u + (a ? 1 : 0),
                h + 1,
                u - 1,
                new x(
                    (l ? y.empty : y.from(i.copy(y.empty))).append(a ? y.empty : y.from(i.copy(y.empty))),
                    l ? 0 : 1,
                    a ? 0 : 1,
                ),
                l ? 0 : 1,
            ),
        ),
        e(n.scrollIntoView()),
        !0
    );
}
function Cf(r) {
    return function (e, t) {
        let { $from: n, $to: i } = e.selection,
            s = n.blockRange(i, (f) => f.childCount > 0 && f.firstChild.type == r);
        if (!s) return !1;
        let o = s.startIndex;
        if (o == 0) return !1;
        let l = s.parent,
            a = l.child(o - 1);
        if (a.type != r) return !1;
        if (t) {
            let f = a.lastChild && a.lastChild.type == l.type,
                c = y.from(f ? r.create() : null),
                h = new x(y.from(r.create(null, y.from(l.type.create(null, c)))), f ? 3 : 1, 0),
                u = s.start,
                p = s.end;
            t(e.tr.step(new T(u - (f ? 3 : 1), p, u, p, h, 1, !0)).scrollIntoView());
        }
        return !0;
    };
}
var ys = (r, e) => (r.selection.empty ? !1 : (e && e(r.tr.deleteSelection().scrollIntoView()), !0));
function xs(r, e) {
    let { $cursor: t } = r.selection;
    return !t || (e ? !e.endOfTextblock('backward', r) : t.parentOffset > 0) ? null : t;
}
var ba = (r, e, t) => {
        let n = xs(r, t);
        if (!n) return !1;
        let i = rr(n);
        if (!i) {
            let o = n.blockRange(),
                l = o && we(o);
            return l == null ? !1 : (e && e(r.tr.lift(o, l).scrollIntoView()), !0);
        }
        let s = i.nodeBefore;
        if (Ms(r, i, e, -1)) return !0;
        if (n.parent.content.size == 0 && (Ge(s, 'end') || S.isSelectable(s)))
            for (let o = n.depth; ; o--) {
                let l = lt(r.doc, n.before(o), n.after(o), x.empty);
                if (l && l.slice.size < l.to - l.from) {
                    if (e) {
                        let a = r.tr.step(l);
                        a.setSelection(
                            Ge(s, 'end')
                                ? k.findFrom(a.doc.resolve(a.mapping.map(i.pos, -1)), -1)
                                : S.create(a.doc, i.pos - s.nodeSize),
                        ),
                            e(a.scrollIntoView());
                    }
                    return !0;
                }
                if (o == 1 || n.node(o - 1).childCount > 1) break;
            }
        return s.isAtom && i.depth == n.depth - 1 ? (e && e(r.tr.delete(i.pos - s.nodeSize, i.pos).scrollIntoView()), !0) : !1;
    },
    Tf = (r, e, t) => {
        let n = xs(r, t);
        if (!n) return !1;
        let i = rr(n);
        return i ? bs(r, i, e) : !1;
    },
    Ef = (r, e, t) => {
        let n = Ss(r, t);
        if (!n) return !1;
        let i = ir(n);
        return i ? bs(r, i, e) : !1;
    };
function bs(r, e, t) {
    let n = e.nodeBefore,
        i = n,
        s = e.pos - 1;
    for (; !i.isTextblock; s--) {
        if (i.type.spec.isolating) return !1;
        let c = i.lastChild;
        if (!c) return !1;
        i = c;
    }
    let o = e.nodeAfter,
        l = o,
        a = e.pos + 1;
    for (; !l.isTextblock; a++) {
        if (l.type.spec.isolating) return !1;
        let c = l.firstChild;
        if (!c) return !1;
        l = c;
    }
    let f = lt(r.doc, s, a, x.empty);
    if (!f || f.from != s || (f instanceof L && f.slice.size >= a - s)) return !1;
    if (t) {
        let c = r.tr.step(f);
        c.setSelection(O.create(c.doc, s)), t(c.scrollIntoView());
    }
    return !0;
}
function Ge(r, e, t = !1) {
    for (let n = r; n; n = e == 'start' ? n.firstChild : n.lastChild) {
        if (n.isTextblock) return !0;
        if (t && n.childCount != 1) return !1;
    }
    return !1;
}
var Sa = (r, e, t) => {
    let { $head: n, empty: i } = r.selection,
        s = n;
    if (!i) return !1;
    if (n.parent.isTextblock) {
        if (t ? !t.endOfTextblock('backward', r) : n.parentOffset > 0) return !1;
        s = rr(n);
    }
    let o = s && s.nodeBefore;
    return !o || !S.isSelectable(o)
        ? !1
        : (e && e(r.tr.setSelection(S.create(r.doc, s.pos - o.nodeSize)).scrollIntoView()), !0);
};
function rr(r) {
    if (!r.parent.type.spec.isolating)
        for (let e = r.depth - 1; e >= 0; e--) {
            if (r.index(e) > 0) return r.doc.resolve(r.before(e + 1));
            if (r.node(e).type.spec.isolating) break;
        }
    return null;
}
function Ss(r, e) {
    let { $cursor: t } = r.selection;
    return !t || (e ? !e.endOfTextblock('forward', r) : t.parentOffset < t.parent.content.size) ? null : t;
}
var ka = (r, e, t) => {
        let n = Ss(r, t);
        if (!n) return !1;
        let i = ir(n);
        if (!i) return !1;
        let s = i.nodeAfter;
        if (Ms(r, i, e, 1)) return !0;
        if (n.parent.content.size == 0 && (Ge(s, 'start') || S.isSelectable(s))) {
            let o = lt(r.doc, n.before(), n.after(), x.empty);
            if (o && o.slice.size < o.to - o.from) {
                if (e) {
                    let l = r.tr.step(o);
                    l.setSelection(
                        Ge(s, 'start')
                            ? k.findFrom(l.doc.resolve(l.mapping.map(i.pos)), 1)
                            : S.create(l.doc, l.mapping.map(i.pos)),
                    ),
                        e(l.scrollIntoView());
                }
                return !0;
            }
        }
        return s.isAtom && i.depth == n.depth - 1 ? (e && e(r.tr.delete(i.pos, i.pos + s.nodeSize).scrollIntoView()), !0) : !1;
    },
    Ma = (r, e, t) => {
        let { $head: n, empty: i } = r.selection,
            s = n;
        if (!i) return !1;
        if (n.parent.isTextblock) {
            if (t ? !t.endOfTextblock('forward', r) : n.parentOffset < n.parent.content.size) return !1;
            s = ir(n);
        }
        let o = s && s.nodeAfter;
        return !o || !S.isSelectable(o) ? !1 : (e && e(r.tr.setSelection(S.create(r.doc, s.pos)).scrollIntoView()), !0);
    };
function ir(r) {
    if (!r.parent.type.spec.isolating)
        for (let e = r.depth - 1; e >= 0; e--) {
            let t = r.node(e);
            if (r.index(e) + 1 < t.childCount) return r.doc.resolve(r.after(e + 1));
            if (t.type.spec.isolating) break;
        }
    return null;
}
var Af = (r, e) => {
        let t = r.selection,
            n = t instanceof S,
            i;
        if (n) {
            if (t.node.isTextblock || !ce(r.doc, t.from)) return !1;
            i = t.from;
        } else if (((i = yn(r.doc, t.from, -1)), i == null)) return !1;
        if (e) {
            let s = r.tr.join(i);
            n && s.setSelection(S.create(s.doc, i - r.doc.resolve(i).nodeBefore.nodeSize)), e(s.scrollIntoView());
        }
        return !0;
    },
    If = (r, e) => {
        let t = r.selection,
            n;
        if (t instanceof S) {
            if (t.node.isTextblock || !ce(r.doc, t.to)) return !1;
            n = t.to;
        } else if (((n = yn(r.doc, t.to, 1)), n == null)) return !1;
        return e && e(r.tr.join(n).scrollIntoView()), !0;
    },
    Rf = (r, e) => {
        let { $from: t, $to: n } = r.selection,
            i = t.blockRange(n),
            s = i && we(i);
        return s == null ? !1 : (e && e(r.tr.lift(i, s).scrollIntoView()), !0);
    },
    Ca = (r, e) => {
        let { $head: t, $anchor: n } = r.selection;
        return !t.parent.type.spec.code || !t.sameParent(n)
            ? !1
            : (e &&
                  e(
                      r.tr
                          .insertText(
                              `
`,
                          )
                          .scrollIntoView(),
                  ),
              !0);
    };
function sr(r) {
    for (let e = 0; e < r.edgeCount; e++) {
        let { type: t } = r.edge(e);
        if (t.isTextblock && !t.hasRequiredAttrs()) return t;
    }
    return null;
}
var Oa = (r, e) => {
        let { $head: t, $anchor: n } = r.selection;
        if (!t.parent.type.spec.code || !t.sameParent(n)) return !1;
        let i = t.node(-1),
            s = t.indexAfter(-1),
            o = sr(i.contentMatchAt(s));
        if (!o || !i.canReplaceWith(s, s, o)) return !1;
        if (e) {
            let l = t.after(),
                a = r.tr.replaceWith(l, l, o.createAndFill());
            a.setSelection(k.near(a.doc.resolve(l), 1)), e(a.scrollIntoView());
        }
        return !0;
    },
    Na = (r, e) => {
        let t = r.selection,
            { $from: n, $to: i } = t;
        if (t instanceof $ || n.parent.inlineContent || i.parent.inlineContent) return !1;
        let s = sr(i.parent.contentMatchAt(i.indexAfter()));
        if (!s || !s.isTextblock) return !1;
        if (e) {
            let o = (!n.parentOffset && i.index() < i.parent.childCount ? n : i).pos,
                l = r.tr.insert(o, s.createAndFill());
            l.setSelection(O.create(l.doc, o + 1)), e(l.scrollIntoView());
        }
        return !0;
    },
    wa = (r, e) => {
        let { $cursor: t } = r.selection;
        if (!t || t.parent.content.size) return !1;
        if (t.depth > 1 && t.after() != t.end(-1)) {
            let s = t.before();
            if (fe(r.doc, s)) return e && e(r.tr.split(s).scrollIntoView()), !0;
        }
        let n = t.blockRange(),
            i = n && we(n);
        return i == null ? !1 : (e && e(r.tr.lift(n, i).scrollIntoView()), !0);
    };
function Da(r) {
    return (e, t) => {
        let { $from: n, $to: i } = e.selection;
        if (e.selection instanceof S && e.selection.node.isBlock)
            return !n.parentOffset || !fe(e.doc, n.pos) ? !1 : (t && t(e.tr.split(n.pos).scrollIntoView()), !0);
        if (!n.depth) return !1;
        let s = [],
            o,
            l,
            a = !1,
            f = !1;
        for (let p = n.depth; ; p--)
            if (n.node(p).isBlock) {
                (a = n.end(p) == n.pos + (n.depth - p)),
                    (f = n.start(p) == n.pos - (n.depth - p)),
                    (l = sr(n.node(p - 1).contentMatchAt(n.indexAfter(p - 1))));
                let m = r && r(i.parent, a, n);
                s.unshift(m || (a && l ? { type: l } : null)), (o = p);
                break;
            } else {
                if (p == 1) return !1;
                s.unshift(null);
            }
        let c = e.tr;
        (e.selection instanceof O || e.selection instanceof $) && c.deleteSelection();
        let h = c.mapping.map(n.pos),
            u = fe(c.doc, h, s.length, s);
        if (
            (u || ((s[0] = l ? { type: l } : null), (u = fe(c.doc, h, s.length, s))),
            c.split(h, s.length, s),
            !a && f && n.node(o).type != l)
        ) {
            let p = c.mapping.map(n.before(o)),
                d = c.doc.resolve(p);
            l && n.node(o - 1).canReplaceWith(d.index(), d.index() + 1, l) && c.setNodeMarkup(c.mapping.map(n.before(o)), l);
        }
        return t && t(c.scrollIntoView()), !0;
    };
}
var ks = Da(),
    zf = (r, e) =>
        ks(
            r,
            e &&
                ((t) => {
                    let n = r.storedMarks || (r.selection.$to.parentOffset && r.selection.$from.marks());
                    n && t.ensureMarks(n), e(t);
                }),
        ),
    Pf = (r, e) => {
        let { $from: t, to: n } = r.selection,
            i,
            s = t.sharedDepth(n);
        return s == 0 ? !1 : ((i = t.before(s)), e && e(r.tr.setSelection(S.create(r.doc, i))), !0);
    },
    Ta = (r, e) => (e && e(r.tr.setSelection(new $(r.doc))), !0);
function Ea(r, e, t) {
    let n = e.nodeBefore,
        i = e.nodeAfter,
        s = e.index();
    return !n || !i || !n.type.compatibleContent(i.type)
        ? !1
        : !n.content.size && e.parent.canReplace(s - 1, s)
          ? (t && t(r.tr.delete(e.pos - n.nodeSize, e.pos).scrollIntoView()), !0)
          : !e.parent.canReplace(s, s + 1) || !(i.isTextblock || ce(r.doc, e.pos))
            ? !1
            : (t && t(r.tr.join(e.pos).scrollIntoView()), !0);
}
function Ms(r, e, t, n) {
    let i = e.nodeBefore,
        s = e.nodeAfter,
        o,
        l,
        a = i.type.spec.isolating || s.type.spec.isolating;
    if (!a && Ea(r, e, t)) return !0;
    let f = !a && e.parent.canReplace(e.index(), e.index() + 1);
    if (f && (o = (l = i.contentMatchAt(i.childCount)).findWrapping(s.type)) && l.matchType(o[0] || s.type).validEnd) {
        if (t) {
            let p = e.pos + s.nodeSize,
                d = y.empty;
            for (let b = o.length - 1; b >= 0; b--) d = y.from(o[b].create(null, d));
            d = y.from(i.copy(d));
            let m = r.tr.step(new T(e.pos - 1, p, e.pos, p, new x(d, 1, 0), o.length, !0)),
                g = m.doc.resolve(p + 2 * o.length);
            g.nodeAfter && g.nodeAfter.type == i.type && ce(m.doc, g.pos) && m.join(g.pos), t(m.scrollIntoView());
        }
        return !0;
    }
    let c = s.type.spec.isolating || (n > 0 && a) ? null : k.findFrom(e, 1),
        h = c && c.$from.blockRange(c.$to),
        u = h && we(h);
    if (u != null && u >= e.depth) return t && t(r.tr.lift(h, u).scrollIntoView()), !0;
    if (f && Ge(s, 'start', !0) && Ge(i, 'end')) {
        let p = i,
            d = [];
        for (; d.push(p), !p.isTextblock; ) p = p.lastChild;
        let m = s,
            g = 1;
        for (; !m.isTextblock; m = m.firstChild) g++;
        if (p.canReplace(p.childCount, p.childCount, m.content)) {
            if (t) {
                let b = y.empty;
                for (let B = d.length - 1; B >= 0; B--) b = y.from(d[B].copy(b));
                let N = r.tr.step(
                    new T(
                        e.pos - d.length,
                        e.pos + s.nodeSize,
                        e.pos + g,
                        e.pos + s.nodeSize - g,
                        new x(b, d.length, 0),
                        0,
                        !0,
                    ),
                );
                t(N.scrollIntoView());
            }
            return !0;
        }
    }
    return !1;
}
function Cs(r) {
    return function (e, t) {
        let n = e.selection,
            i = r < 0 ? n.$from : n.$to,
            s = i.depth;
        for (; i.node(s).isInline; ) {
            if (!s) return !1;
            s--;
        }
        return i.node(s).isTextblock ? (t && t(e.tr.setSelection(O.create(e.doc, r < 0 ? i.start(s) : i.end(s)))), !0) : !1;
    };
}
var Aa = Cs(-1),
    Ia = Cs(1);
function Bf(r, e = null) {
    return function (t, n) {
        let { $from: i, $to: s } = t.selection,
            o = i.blockRange(s),
            l = o && Pt(o, r, e);
        return l ? (n && n(t.tr.wrap(o, l).scrollIntoView()), !0) : !1;
    };
}
function Ff(r, e = null) {
    return function (t, n) {
        let i = !1;
        for (let s = 0; s < t.selection.ranges.length && !i; s++) {
            let {
                $from: { pos: o },
                $to: { pos: l },
            } = t.selection.ranges[s];
            t.doc.nodesBetween(o, l, (a, f) => {
                if (i) return !1;
                if (!(!a.isTextblock || a.hasMarkup(r, e)))
                    if (a.type == r) i = !0;
                    else {
                        let c = t.doc.resolve(f),
                            h = c.index();
                        i = c.parent.canReplaceWith(h, h + 1, r);
                    }
            });
        }
        if (!i) return !1;
        if (n) {
            let s = t.tr;
            for (let o = 0; o < t.selection.ranges.length; o++) {
                let {
                    $from: { pos: l },
                    $to: { pos: a },
                } = t.selection.ranges[o];
                s.setBlockType(l, a, r, e);
            }
            n(s.scrollIntoView());
        }
        return !0;
    };
}
function Ra(r, e, t, n) {
    for (let i = 0; i < e.length; i++) {
        let { $from: s, $to: o } = e[i],
            l = s.depth == 0 ? r.inlineContent && r.type.allowsMarkType(t) : !1;
        if (
            (r.nodesBetween(s.pos, o.pos, (a, f) => {
                if (l || (!n && a.isAtom && a.isInline && f >= s.pos && f + a.nodeSize <= o.pos)) return !1;
                l = a.inlineContent && a.type.allowsMarkType(t);
            }),
            l)
        )
            return !0;
    }
    return !1;
}
function za(r) {
    let e = [];
    for (let t = 0; t < r.length; t++) {
        let { $from: n, $to: i } = r[t];
        n.doc.nodesBetween(n.pos, i.pos, (s, o) => {
            if (s.isAtom && s.content.size && s.isInline && o >= n.pos && o + s.nodeSize <= i.pos)
                return (
                    o + 1 > n.pos && e.push(new Je(n, n.doc.resolve(o + 1))), (n = n.doc.resolve(o + 1 + s.content.size)), !1
                );
        }),
            n.pos < i.pos && e.push(new Je(n, i));
    }
    return e;
}
function vf(r, e = null, t) {
    let n = (t && t.removeWhenPresent) !== !1,
        i = (t && t.enterInlineAtoms) !== !1;
    return function (s, o) {
        let { empty: l, $cursor: a, ranges: f } = s.selection;
        if ((l && !a) || !Ra(s.doc, f, r, i)) return !1;
        if (o)
            if (a) r.isInSet(s.storedMarks || a.marks()) ? o(s.tr.removeStoredMark(r)) : o(s.tr.addStoredMark(r.create(e)));
            else {
                let c,
                    h = s.tr;
                i || (f = za(f)),
                    n
                        ? (c = !f.some((u) => s.doc.rangeHasMark(u.$from.pos, u.$to.pos, r)))
                        : (c = !f.every((u) => {
                              let p = !1;
                              return (
                                  h.doc.nodesBetween(u.$from.pos, u.$to.pos, (d, m, g) => {
                                      if (p) return !1;
                                      p =
                                          !r.isInSet(d.marks) &&
                                          !!g &&
                                          g.type.allowsMarkType(r) &&
                                          !(
                                              d.isText &&
                                              /^\s*$/.test(
                                                  d.textBetween(
                                                      Math.max(0, u.$from.pos - m),
                                                      Math.min(d.nodeSize, u.$to.pos - m),
                                                  ),
                                              )
                                          );
                                  }),
                                  !p
                              );
                          }));
                for (let u = 0; u < f.length; u++) {
                    let { $from: p, $to: d } = f[u];
                    if (!c) h.removeMark(p.pos, d.pos, r);
                    else {
                        let m = p.pos,
                            g = d.pos,
                            b = p.nodeAfter,
                            N = d.nodeBefore,
                            B = b && b.isText ? /^\s*/.exec(b.text)[0].length : 0,
                            Y = N && N.isText ? /\s*$/.exec(N.text)[0].length : 0;
                        m + B < g && ((m += B), (g -= Y)), h.addMark(m, g, r.create(e));
                    }
                }
                o(h.scrollIntoView());
            }
        return !0;
    };
}
function Pa(r, e) {
    return (t) => {
        if (!t.isGeneric) return r(t);
        let n = [];
        for (let s = 0; s < t.mapping.maps.length; s++) {
            let o = t.mapping.maps[s];
            for (let l = 0; l < n.length; l++) n[l] = o.map(n[l]);
            o.forEach((l, a, f, c) => n.push(f, c));
        }
        let i = [];
        for (let s = 0; s < n.length; s += 2) {
            let o = n[s],
                l = n[s + 1],
                a = t.doc.resolve(o),
                f = a.sharedDepth(l),
                c = a.node(f);
            for (let h = a.indexAfter(f), u = a.after(f + 1); u <= l; ++h) {
                let p = c.maybeChild(h);
                if (!p) break;
                if (h && i.indexOf(u) == -1) {
                    let d = c.child(h - 1);
                    d.type == p.type && e(d, p) && i.push(u);
                }
                u += p.nodeSize;
            }
        }
        i.sort((s, o) => s - o);
        for (let s = i.length - 1; s >= 0; s--) ce(t.doc, i[s]) && t.join(i[s]);
        r(t);
    };
}
function Vf(r, e) {
    let t = Array.isArray(e) ? (n) => e.indexOf(n.type.name) > -1 : e;
    return (n, i, s) => r(n, i && Pa(i, t), s);
}
function or(...r) {
    return function (e, t, n) {
        for (let i = 0; i < r.length; i++) if (r[i](e, t, n)) return !0;
        return !1;
    };
}
var nr = or(ys, ba, Sa),
    gs = or(ys, ka, Ma),
    oe = {
        Enter: or(Ca, Na, wa, ks),
        'Mod-Enter': Oa,
        Backspace: nr,
        'Mod-Backspace': nr,
        'Shift-Backspace': nr,
        Delete: gs,
        'Mod-Delete': gs,
        'Mod-a': Ta,
    },
    Os = {
        'Ctrl-h': oe.Backspace,
        'Alt-Backspace': oe['Mod-Backspace'],
        'Ctrl-d': oe.Delete,
        'Ctrl-Alt-Backspace': oe['Mod-Delete'],
        'Alt-Delete': oe['Mod-Delete'],
        'Alt-d': oe['Mod-Delete'],
        'Ctrl-a': Aa,
        'Ctrl-e': Ia,
    };
for (let r in oe) Os[r] = oe[r];
var Ba =
        typeof navigator < 'u'
            ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
            : typeof os < 'u' && os.platform
              ? os.platform() == 'darwin'
              : !1,
    Lf = Ba ? Os : oe;
var Xt = 200,
    I = function () {};
I.prototype.append = function (e) {
    return e.length
        ? ((e = I.from(e)),
          (!this.length && e) ||
              (e.length < Xt && this.leafAppend(e)) ||
              (this.length < Xt && e.leafPrepend(this)) ||
              this.appendInner(e))
        : this;
};
I.prototype.prepend = function (e) {
    return e.length ? I.from(e).append(this) : this;
};
I.prototype.appendInner = function (e) {
    return new Fa(this, e);
};
I.prototype.slice = function (e, t) {
    return (
        e === void 0 && (e = 0),
        t === void 0 && (t = this.length),
        e >= t ? I.empty : this.sliceInner(Math.max(0, e), Math.min(this.length, t))
    );
};
I.prototype.get = function (e) {
    if (!(e < 0 || e >= this.length)) return this.getInner(e);
};
I.prototype.forEach = function (e, t, n) {
    t === void 0 && (t = 0),
        n === void 0 && (n = this.length),
        t <= n ? this.forEachInner(e, t, n, 0) : this.forEachInvertedInner(e, t, n, 0);
};
I.prototype.map = function (e, t, n) {
    t === void 0 && (t = 0), n === void 0 && (n = this.length);
    var i = [];
    return (
        this.forEach(
            function (s, o) {
                return i.push(e(s, o));
            },
            t,
            n,
        ),
        i
    );
};
I.from = function (e) {
    return e instanceof I ? e : e && e.length ? new Ns(e) : I.empty;
};
var Ns = (function (r) {
    function e(n) {
        r.call(this), (this.values = n);
    }
    r && (e.__proto__ = r), (e.prototype = Object.create(r && r.prototype)), (e.prototype.constructor = e);
    var t = { length: { configurable: !0 }, depth: { configurable: !0 } };
    return (
        (e.prototype.flatten = function () {
            return this.values;
        }),
        (e.prototype.sliceInner = function (i, s) {
            return i == 0 && s == this.length ? this : new e(this.values.slice(i, s));
        }),
        (e.prototype.getInner = function (i) {
            return this.values[i];
        }),
        (e.prototype.forEachInner = function (i, s, o, l) {
            for (var a = s; a < o; a++) if (i(this.values[a], l + a) === !1) return !1;
        }),
        (e.prototype.forEachInvertedInner = function (i, s, o, l) {
            for (var a = s - 1; a >= o; a--) if (i(this.values[a], l + a) === !1) return !1;
        }),
        (e.prototype.leafAppend = function (i) {
            if (this.length + i.length <= Xt) return new e(this.values.concat(i.flatten()));
        }),
        (e.prototype.leafPrepend = function (i) {
            if (this.length + i.length <= Xt) return new e(i.flatten().concat(this.values));
        }),
        (t.length.get = function () {
            return this.values.length;
        }),
        (t.depth.get = function () {
            return 0;
        }),
        Object.defineProperties(e.prototype, t),
        e
    );
})(I);
I.empty = new Ns([]);
var Fa = (function (r) {
        function e(t, n) {
            r.call(this),
                (this.left = t),
                (this.right = n),
                (this.length = t.length + n.length),
                (this.depth = Math.max(t.depth, n.depth) + 1);
        }
        return (
            r && (e.__proto__ = r),
            (e.prototype = Object.create(r && r.prototype)),
            (e.prototype.constructor = e),
            (e.prototype.flatten = function () {
                return this.left.flatten().concat(this.right.flatten());
            }),
            (e.prototype.getInner = function (n) {
                return n < this.left.length ? this.left.get(n) : this.right.get(n - this.left.length);
            }),
            (e.prototype.forEachInner = function (n, i, s, o) {
                var l = this.left.length;
                if (
                    (i < l && this.left.forEachInner(n, i, Math.min(s, l), o) === !1) ||
                    (s > l && this.right.forEachInner(n, Math.max(i - l, 0), Math.min(this.length, s) - l, o + l) === !1)
                )
                    return !1;
            }),
            (e.prototype.forEachInvertedInner = function (n, i, s, o) {
                var l = this.left.length;
                if (
                    (i > l && this.right.forEachInvertedInner(n, i - l, Math.max(s, l) - l, o + l) === !1) ||
                    (s < l && this.left.forEachInvertedInner(n, Math.min(i, l), s, o) === !1)
                )
                    return !1;
            }),
            (e.prototype.sliceInner = function (n, i) {
                if (n == 0 && i == this.length) return this;
                var s = this.left.length;
                return i <= s
                    ? this.left.slice(n, i)
                    : n >= s
                      ? this.right.slice(n - s, i - s)
                      : this.left.slice(n, s).append(this.right.slice(0, i - s));
            }),
            (e.prototype.leafAppend = function (n) {
                var i = this.right.leafAppend(n);
                if (i) return new e(this.left, i);
            }),
            (e.prototype.leafPrepend = function (n) {
                var i = this.left.leafPrepend(n);
                if (i) return new e(i, this.right);
            }),
            (e.prototype.appendInner = function (n) {
                return this.left.depth >= Math.max(this.right.depth, n.depth) + 1
                    ? new e(this.left, new e(this.right, n))
                    : new e(this, n);
            }),
            e
        );
    })(I),
    lr = I;
var va = 500,
    Fe = class r {
        constructor(e, t) {
            (this.items = e), (this.eventCount = t);
        }
        popEvent(e, t) {
            if (this.eventCount == 0) return null;
            let n = this.items.length;
            for (; ; n--)
                if (this.items.get(n - 1).selection) {
                    --n;
                    break;
                }
            let i, s;
            t && ((i = this.remapping(n, this.items.length)), (s = i.maps.length));
            let o = e.tr,
                l,
                a,
                f = [],
                c = [];
            return (
                this.items.forEach(
                    (h, u) => {
                        if (!h.step) {
                            i || ((i = this.remapping(n, u + 1)), (s = i.maps.length)), s--, c.push(h);
                            return;
                        }
                        if (i) {
                            c.push(new _(h.map));
                            let p = h.step.map(i.slice(s)),
                                d;
                            p &&
                                o.maybeStep(p).doc &&
                                ((d = o.mapping.maps[o.mapping.maps.length - 1]),
                                f.push(new _(d, void 0, void 0, f.length + c.length))),
                                s--,
                                d && i.appendMap(d, s);
                        } else o.maybeStep(h.step);
                        if (h.selection)
                            return (
                                (l = i ? h.selection.map(i.slice(s)) : h.selection),
                                (a = new r(this.items.slice(0, n).append(c.reverse().concat(f)), this.eventCount - 1)),
                                !1
                            );
                    },
                    this.items.length,
                    0,
                ),
                { remaining: a, transform: o, selection: l }
            );
        }
        addTransform(e, t, n, i) {
            let s = [],
                o = this.eventCount,
                l = this.items,
                a = !i && l.length ? l.get(l.length - 1) : null;
            for (let c = 0; c < e.steps.length; c++) {
                let h = e.steps[c].invert(e.docs[c]),
                    u = new _(e.mapping.maps[c], h, t),
                    p;
                (p = a && a.merge(u)) && ((u = p), c ? s.pop() : (l = l.slice(0, l.length - 1))),
                    s.push(u),
                    t && (o++, (t = void 0)),
                    i || (a = u);
            }
            let f = o - n.depth;
            return f > La && ((l = Va(l, f)), (o -= f)), new r(l.append(s), o);
        }
        remapping(e, t) {
            let n = new rt();
            return (
                this.items.forEach(
                    (i, s) => {
                        let o = i.mirrorOffset != null && s - i.mirrorOffset >= e ? n.maps.length - i.mirrorOffset : void 0;
                        n.appendMap(i.map, o);
                    },
                    e,
                    t,
                ),
                n
            );
        }
        addMaps(e) {
            return this.eventCount == 0 ? this : new r(this.items.append(e.map((t) => new _(t))), this.eventCount);
        }
        rebased(e, t) {
            if (!this.eventCount) return this;
            let n = [],
                i = Math.max(0, this.items.length - t),
                s = e.mapping,
                o = e.steps.length,
                l = this.eventCount;
            this.items.forEach((u) => {
                u.selection && l--;
            }, i);
            let a = t;
            this.items.forEach((u) => {
                let p = s.getMirror(--a);
                if (p == null) return;
                o = Math.min(o, p);
                let d = s.maps[p];
                if (u.step) {
                    let m = e.steps[p].invert(e.docs[p]),
                        g = u.selection && u.selection.map(s.slice(a + 1, p));
                    g && l++, n.push(new _(d, m, g));
                } else n.push(new _(d));
            }, i);
            let f = [];
            for (let u = t; u < o; u++) f.push(new _(s.maps[u]));
            let c = this.items.slice(0, i).append(f).append(n),
                h = new r(c, l);
            return h.emptyItemCount() > va && (h = h.compress(this.items.length - n.length)), h;
        }
        emptyItemCount() {
            let e = 0;
            return (
                this.items.forEach((t) => {
                    t.step || e++;
                }),
                e
            );
        }
        compress(e = this.items.length) {
            let t = this.remapping(0, e),
                n = t.maps.length,
                i = [],
                s = 0;
            return (
                this.items.forEach(
                    (o, l) => {
                        if (l >= e) i.push(o), o.selection && s++;
                        else if (o.step) {
                            let a = o.step.map(t.slice(n)),
                                f = a && a.getMap();
                            if ((n--, f && t.appendMap(f, n), a)) {
                                let c = o.selection && o.selection.map(t.slice(n));
                                c && s++;
                                let h = new _(f.invert(), a, c),
                                    u,
                                    p = i.length - 1;
                                (u = i.length && i[p].merge(h)) ? (i[p] = u) : i.push(h);
                            }
                        } else o.map && n--;
                    },
                    this.items.length,
                    0,
                ),
                new r(lr.from(i.reverse()), s)
            );
        }
    };
Fe.empty = new Fe(lr.empty, 0);
function Va(r, e) {
    let t;
    return (
        r.forEach((n, i) => {
            if (n.selection && e-- == 0) return (t = i), !1;
        }),
        r.slice(t)
    );
}
var _ = class r {
        constructor(e, t, n, i) {
            (this.map = e), (this.step = t), (this.selection = n), (this.mirrorOffset = i);
        }
        merge(e) {
            if (this.step && e.step && !e.selection) {
                let t = e.step.merge(this.step);
                if (t) return new r(t.getMap().invert(), t, this.selection);
            }
        }
    },
    ee = class {
        constructor(e, t, n, i, s) {
            (this.done = e), (this.undone = t), (this.prevRanges = n), (this.prevTime = i), (this.prevComposition = s);
        }
    },
    La = 20;
function Ja(r, e, t, n) {
    let i = t.getMeta(le),
        s;
    if (i) return i.historyState;
    t.getMeta(Ts) && (r = new ee(r.done, r.undone, null, 0, -1));
    let o = t.getMeta('appendedTransaction');
    if (t.steps.length == 0) return r;
    if (o && o.getMeta(le))
        return o.getMeta(le).redo
            ? new ee(r.done.addTransform(t, void 0, n, Zt(e)), r.undone, ws(t.mapping.maps), r.prevTime, r.prevComposition)
            : new ee(r.done, r.undone.addTransform(t, void 0, n, Zt(e)), null, r.prevTime, r.prevComposition);
    if (t.getMeta('addToHistory') !== !1 && !(o && o.getMeta('addToHistory') === !1)) {
        let l = t.getMeta('composition'),
            a =
                r.prevTime == 0 ||
                (!o && r.prevComposition != l && (r.prevTime < (t.time || 0) - n.newGroupDelay || !Wa(t, r.prevRanges))),
            f = o ? ar(r.prevRanges, t.mapping) : ws(t.mapping.maps);
        return new ee(
            r.done.addTransform(t, a ? e.selection.getBookmark() : void 0, n, Zt(e)),
            Fe.empty,
            f,
            t.time,
            l ?? r.prevComposition,
        );
    } else
        return (s = t.getMeta('rebased'))
            ? new ee(r.done.rebased(t, s), r.undone.rebased(t, s), ar(r.prevRanges, t.mapping), r.prevTime, r.prevComposition)
            : new ee(
                  r.done.addMaps(t.mapping.maps),
                  r.undone.addMaps(t.mapping.maps),
                  ar(r.prevRanges, t.mapping),
                  r.prevTime,
                  r.prevComposition,
              );
}
function Wa(r, e) {
    if (!e) return !1;
    if (!r.docChanged) return !0;
    let t = !1;
    return (
        r.mapping.maps[0].forEach((n, i) => {
            for (let s = 0; s < e.length; s += 2) n <= e[s + 1] && i >= e[s] && (t = !0);
        }),
        t
    );
}
function ws(r) {
    let e = [];
    for (let t = r.length - 1; t >= 0 && e.length == 0; t--) r[t].forEach((n, i, s, o) => e.push(s, o));
    return e;
}
function ar(r, e) {
    if (!r) return null;
    let t = [];
    for (let n = 0; n < r.length; n += 2) {
        let i = e.map(r[n], 1),
            s = e.map(r[n + 1], -1);
        i <= s && t.push(i, s);
    }
    return t;
}
function $a(r, e, t) {
    let n = Zt(e),
        i = le.get(e).spec.config,
        s = (t ? r.undone : r.done).popEvent(e, n);
    if (!s) return null;
    let o = s.selection.resolve(s.transform.doc),
        l = (t ? r.done : r.undone).addTransform(s.transform, e.selection.getBookmark(), i, n),
        a = new ee(t ? l : s.remaining, t ? s.remaining : l, null, 0, -1);
    return s.transform.setSelection(o).setMeta(le, { redo: t, historyState: a });
}
var fr = !1,
    Ds = null;
function Zt(r) {
    let e = r.plugins;
    if (Ds != e) {
        (fr = !1), (Ds = e);
        for (let t = 0; t < e.length; t++)
            if (e[t].spec.historyPreserveItems) {
                fr = !0;
                break;
            }
    }
    return fr;
}
function Hf(r) {
    return r.setMeta(Ts, !0);
}
var le = new ft('history'),
    Ts = new ft('closeHistory');
function jf(r = {}) {
    return (
        (r = { depth: r.depth || 100, newGroupDelay: r.newGroupDelay || 500 }),
        new We({
            key: le,
            state: {
                init() {
                    return new ee(Fe.empty, Fe.empty, null, 0, -1);
                },
                apply(e, t, n) {
                    return Ja(t, n, e, r);
                },
            },
            config: r,
            props: {
                handleDOMEvents: {
                    beforeinput(e, t) {
                        let n = t.inputType,
                            i = n == 'historyUndo' ? qa : n == 'historyRedo' ? Ka : null;
                        return i ? (t.preventDefault(), i(e.state, e.dispatch)) : !1;
                    },
                },
            },
        })
    );
}
function Qt(r, e) {
    return (t, n) => {
        let i = le.getState(t);
        if (!i || (r ? i.undone : i.done).eventCount == 0) return !1;
        if (n) {
            let s = $a(i, t, r);
            s && n(e ? s.scrollIntoView() : s);
        }
        return !0;
    };
}
var qa = Qt(!1, !0),
    Ka = Qt(!0, !0),
    Uf = Qt(!1, !1),
    Gf = Qt(!0, !1);
function Yf(r) {
    let e = le.getState(r);
    return e ? e.done.eventCount : 0;
}
function Xf(r) {
    let e = le.getState(r);
    return e ? e.undone.eventCount : 0;
}
export {
    $ as AllSelection,
    Ce as ContentMatch,
    Qe as DOMParser,
    Oe as DOMSerializer,
    ge as Decoration,
    j as DecorationSet,
    ni as EditorState,
    zi as EditorView,
    y as Fragment,
    C as Mark,
    Ze as MarkType,
    X as Node,
    Me as NodeRange,
    S as NodeSelection,
    Dt as NodeType,
    We as Plugin,
    ft as PluginKey,
    ke as ReplaceError,
    wt as ResolvedPos,
    Tt as Schema,
    k as Selection,
    Je as SelectionRange,
    x as Slice,
    O as TextSelection,
    kn as Transaction,
    of as __endComposition,
    sf as __parseFromClipboard,
    rf as __serializeForClipboard,
    bf as addListNodes,
    Vf as autoJoin,
    Lf as baseKeymap,
    ua as bulletList,
    or as chainCommands,
    Hf as closeHistory,
    Na as createParagraphNear,
    ys as deleteSelection,
    Oa as exitCode,
    jf as history,
    ba as joinBackward,
    If as joinDown,
    ka as joinForward,
    Tf as joinTextblockBackward,
    Ef as joinTextblockForward,
    Af as joinUp,
    Zl as keydownHandler,
    hf as keymap,
    Rf as lift,
    wa as liftEmptyBlock,
    Mf as liftListItem,
    da as listItem,
    Os as macBaseKeymap,
    la as marks,
    Ca as newlineInCode,
    ra as nodes,
    ha as orderedList,
    oe as pcBaseKeymap,
    Ka as redo,
    Xf as redoDepth,
    Gf as redoNoScroll,
    pf as schema,
    Ta as selectAll,
    Sa as selectNodeBackward,
    Ma as selectNodeForward,
    Pf as selectParentNode,
    Ia as selectTextblockEnd,
    Aa as selectTextblockStart,
    Ff as setBlockType,
    Cf as sinkListItem,
    ks as splitBlock,
    Da as splitBlockAs,
    zf as splitBlockKeepMarks,
    ga as splitListItem,
    kf as splitListItemKeepMarks,
    vf as toggleMark,
    qa as undo,
    Yf as undoDepth,
    Uf as undoNoScroll,
    Bf as wrapIn,
    Sf as wrapInList,
    pa as wrapRangeInList,
};
//# sourceMappingURL=prosemirror.js.map
