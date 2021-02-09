function gcd(a, b) {
    if (a < b) {
        let c = a;
        a = b;
        b = c;
    }
    while (b) {
        let c = a % b;
        a = b;
        b = c;
    }
    return a;
}
function lcm(a, b) {
    return a * b / gcd(a, b);
}

class Faction {
    constructor(a, b) {
        if (b === undefined) {
            this.a = a.a;
            this.b = a.b;
            this.sign = a.sign;
            return;
        }
        // a / b
        this.a = a;
        this.b = b;
        this.sign = 1;
        this.simple();
    }
    value() {
        return this.sign * this.a / this.b;
    }
    mul(faction) {
        this.a *= faction.a;
        this.b *= faction.b;
        this.sign *= faction.sign;
        return this.simple();
    }
    mul_(faction) {
        let f = new Faction(this);
        f.a *= faction.a;
        f.b *= faction.b;
        f.sign *= faction.sign;
        return f.simple();
    }
    simple() {
        this.sign = Math.sign(this.a) * Math.sign(this.b) * this.sign;
        this.a = Math.abs(this.a);
        this.b = Math.abs(this.b);
        let _gcd = gcd(this.a, this.b);
        this.a /= _gcd;
        this.b /= _gcd;
        return this;
    }
    add(faction) {
        if (this.sign === 0) {
            this.a = faction.a;
            this.b = faction.b;
            this.sign = faction.sign;
            return this;
        }
        this.simple()
        faction.simple()
        let _lcm = lcm(faction.b, this.b);
        this.a *= _lcm / this.b;
        this.b = _lcm;
        if (this.sign === faction.sign) this.a += faction.a * _lcm / faction.b;
        else this.a -= faction.a * _lcm / faction.b;
        return this.simple();
    }
    mulInvers() {
        let c = this.a;
        this.a = this.b;
        this.b = c;
        return this;
    }
    toString() {
        return `${this.sign ? "" : "-"}${this.a}/${this.b}`;
    }
}

function swapLine(matrix, i, j) {
    if (i !== j) {
        let tmp = matrix[i];
        matrix[i] = matrix[j];
        matrix[j] = tmp;
    }
}
function mulLine(matrix, i, lambda) {
    for (let j = 0; j < matrix[i].length; j++) {
        matrix[i][j].mul(lambda);
    }
}
function addLine(matrix, i, j, lambda) {
    for (let k = 0; k < matrix[i].length; k++) {
        matrix[i][k].add(matrix[j][k].mul_(lambda));
    }
}
function isZeroLine(matrix, i) {
    for (let ele of matrix[i]) {
        if (ele) return false;
    }
    return true;
}

function gaussian(matrix) {
    // console.log(matrix)
    // 处理：化为分数
    for (let i of matrix) {
        for (let j = 0; j < i.length; j++) {
            i[j] = new Faction(i[j], 1);
        }
    }
    for (let unknown = 0; unknown < matrix[0].length; unknown++) {
        let keyline = null;
        for (let j = unknown; j < matrix.length; j++) {
            if (matrix[j][unknown].a !== 0) {
                swapLine(matrix, j, unknown);
                keyline = unknown;
                let k = new Faction(matrix[keyline][unknown]);
                k.mulInvers();
                mulLine(matrix, keyline, k);
                break;
            }
        }
        if (keyline === null) break;
        for (let i = keyline + 1; i < matrix.length; i++) {// 消元
            let v = new Faction(matrix[i][unknown]);
            v.sign *= -1;
            addLine(matrix, i, keyline, v);
        }
    }
    if (matrix[0].length < 2) return;
    // trans to int
    for (let i = 0; i < matrix.length; i++) {
        // find lcm of a line
        let _lcm = lcm(matrix[i][0].b, matrix[i][1].b);
        // console.log(_lcm);
        for (let j = 2; j < matrix[0].length; j++) _lcm = lcm(_lcm, matrix[i][j].b);
        let faction = new Faction(_lcm, 1);
        mulLine(matrix, i, faction);
        for (let j = 0; j < matrix[0].length; j++) {
            matrix[i][j] = matrix[i][j].value();
        }
    }
    // console.log(matrix);
    for (let i = matrix.length - 1; ~i; i--)
        if (isNaN(matrix[i][0]) || isZeroLine(matrix, i)) matrix.pop();
}

exports.gaussian = gaussian;
exports.Faction = Faction;
exports.swapLine = swapLine;
exports.addLine = addLine;
exports.mulLine = mulLine;
exports.lcm = lcm;
exports.gcd = gcd;
