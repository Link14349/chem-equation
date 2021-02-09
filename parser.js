const { gaussian, swapLine, addLine, mulLine, Faction, lcm, gcd } = require("./math");

class Token {
    constructor(type, content, i) {
        /*
        * type:
        *   0: number
        *   1: element
        *   2: operator
        *   3: 括号
        * */
        this.type = type;
        this.content = content;
        this.i = i;
    }
}

class Lexer {
    constructor(eq) {
        this.eq = eq;
        this.i = 0;
    }
    type(c) {
        if (c === "+" || c === "=") return 2;
        if (c === "(" || c === ")") return 3;
        let tmp = c.charCodeAt(0) - "0".charCodeAt(0);
        if (tmp >= 0 && tmp <= 9) return 0;
        if (c === " " || c === "\t") return -1;
        return 1;
    }
    get() {
        if (this.i >= this.eq.length) return null;
        // skip space
        while (this.eq[this.i] === ' ' || this.eq[this.i] === '\t') {
            this.i++;
            if (this.i >= this.eq.length) return null;
        }
        let c = this.eq[this.i];
        let token = new Token(this.type(c), c, this.i++);
        while (this.i < this.eq.length && token.type === this.type(c = this.eq[this.i]) && (token.type === 1 ? c === c.toLowerCase() : true)) {
            token.content += c;
            this.i++;
        }
        // if (this.i < this.eq.length) this.i--;
        return token;
    }
}

class CEFormatError extends Error {
    constructor(message) {
        super();
        this.name = "CEFormatError";
        this.message = message;
    }

}

class Material {
    constructor(ele = { }) {
        this.ele = ele;
        this.count = null;
        this.name = "";
    }
    toString() {
        return (this.count === 1 ? "" : this.count) + this.name;
    }
}

class ChemEquation {
    constructor(eq) {
        let lexer = new Lexer(eq);
        let token;
        // while (token = lexer.get()) console.log(token);
        this.reactant = [ ];
        this.produce = [ ];
        this.rele = [];
        this.pele = [];
        token = lexer.get();
        function get(list, eles) {
            let reactantMaterial = new Material();
            let reactant = reactantMaterial.ele;
            let eleMap = {};
            function lonRoot() {
                let tmp = [];
                let tmpeles = [];
                reactantMaterial.name += "(";
                token = lexer.get();
                get(tmp, tmpeles);
                let m = tmp[0];
                reactantMaterial.name += m.name + ")";
                reactantMaterial.name += token.content;
                let lambda = Number(token.content);
                for (let i in m.ele) {
                    if (reactant[i]) reactant[i] += lambda * m.ele[i];
                    else reactant[i] = lambda * m.ele[i];
                }
                for (let el of tmpeles) {
                    if (!eleMap[el]) {
                        eles.push(eleMap[el] = el);
                    }
                }
                lexer.get();
                if (token.type !== 1) {
                    if (token.type === 2) {
                        list.push(reactantMaterial);
                        reactantMaterial = new Material();
                        reactant = reactantMaterial.ele;
                    }
                    if (token.content === "+") token = lexer.get();
                }
            }
            while (token) {
                if (token.content === "(") {
                    lonRoot();
                    if (token.content === "=") break;
                    // token = lexer.get();
                }
                if (token.type !== 1) throw new CEFormatError(`Unexpected token: '${token.content}' at ${token.i + 1}`);
                let eleName = token.content;
                reactantMaterial.name += token.content;
                if (!eleMap[eleName]) eles.push(eleMap[eleName] = eleName);
                token = lexer.get();
                if (!token || (token.content === ")" && (token = lexer.get() || true))) {
                    reactant[eleName] ? reactant[eleName]++ : reactant[eleName] = 1;
                    list.push(reactantMaterial);
                    reactantMaterial = new Material();
                    reactant = reactantMaterial.ele;
                    break;
                }
                if (token.type) {
                    reactant[eleName] ? reactant[eleName]++ : reactant[eleName] = 1;
                    if (token.type === 1) continue;
                    if (token.content === "(") {
                        lonRoot();
                        if (token.content === "=") break;
                        // token = lexer.get();
                    }
                    list.push(reactantMaterial);
                    reactantMaterial = new Material();
                    reactant = reactantMaterial.ele;
                    if (token.content === "=") break;
                    token = lexer.get();
                    continue;
                }
                reactantMaterial.name += token.content;
                reactant[eleName] ? reactant[eleName] += Number(token.content) : reactant[eleName] = Number(token.content);
                token = lexer.get();
                if (!token || (token.content === ")" && (token = lexer.get() || true))) {
                    list.push(reactantMaterial);
                    reactantMaterial = new Material();
                    reactant = reactantMaterial.ele;
                    break;
                }
                if (token.type === 2) {
                    list.push(reactantMaterial);
                    reactantMaterial = new Material();
                    reactant = reactantMaterial.ele;
                    if (token.content === '=') break;
                    token = lexer.get();
                }
            }
        }
        get(this.reactant, this.rele);
        token = lexer.get();
        get(this.produce, this.pele);
    }
    balance() {
        // console.log(this);
        let matrix = [];
        for (let ele of this.rele) {
            let line = [];
            for (let reactant of this.reactant) line.push(reactant.ele[ele] ? reactant.ele[ele] : 0);
            for (let produce of this.produce) line.push(produce.ele[ele] ? -produce.ele[ele] : 0);
            matrix.push(line);
        }
        // console.log(matrix);
        gaussian(matrix);
        // console.log(matrix);
        let self = this;
        function transUnknownIdxToMaterialObject(unknown) {
            if (unknown < self.reactant.length) return self.reactant[unknown];
            return self.produce[unknown - self.reactant.length];
        }
        let FVC = matrix[0].length - matrix.length;
        let unknowns = [];
        for (let i = 0; i < matrix.length; i++) {
            let arr = [];
            for (let j = matrix.length; j < matrix[0].length; j++)
                arr.push(new Faction(-matrix[i][j], 1));
            unknowns.push(arr);
        }
        let unFVC = unknowns.length;
        for (let i = 0; i < FVC; i++) {
            let tmp = [];
            for (let j = 0; j < i; j++)
                tmp.push(new Faction(0, 1));
            tmp.push(new Faction(1, 1));
            for (let j = i + 1; j < FVC; j++)
                tmp.push(new Faction(0, 1));
            unknowns.push(tmp);
        }
        // console.log(unknowns);
        for (let i = unFVC - 1; ~i; i--) {
            for (let j = i + 1; j < matrix[i].length - FVC; j++) {
                addLine(unknowns, i, j, new Faction(-matrix[i][j], 1));
            }
            mulLine(unknowns, i, new Faction(1, matrix[i][i]));
        }
        // console.log(unknowns)
        let freeVariable = [];
        for (let i = 0; i < FVC; i++) {
            let _lcm = lcm(unknowns[0][i].b, 1);
            for (let j = 1; j < unFVC; j++) {
                _lcm = lcm(unknowns[j][i].b, _lcm)
            }
            freeVariable.push(new Faction(_lcm, 1));
        }
        // console.log(unknowns);
        // console.log(freeVariable);
        let variables = [];
        for (let i = 0; i < unknowns.length; i++) {
            let v = new Faction(0, 1);
            for (let j = 0; j < unknowns[i].length; j++) {
                // console.log(unknowns[i][j].mul_(freeVariable[j]))
                v.add(unknowns[i][j].mul_(freeVariable[j]));
            }
            // console.log(v)
            variables.push(v.value());
        }
        for (let i = 0; i < variables.length; i++) {
            transUnknownIdxToMaterialObject(i).count = variables[i];
        }
        return this;
    }
    toString() {
        let out = "";
        for (let i = 0; i < this.reactant.length; i++) {
            out += this.reactant[i].toString();
            if (i + 1 < this.reactant.length) out += "+";
        }
        out += "=";
        for (let i = 0; i < this.produce.length; i++) {
            out += this.produce[i].toString();
            if (i + 1 < this.produce.length) out += "+";
        }
        return out;
    }
}

exports.ChemEquation = ChemEquation;
/*
Al+Fe2O3=Fe+Al2O3
Al+Fe3O4=Fe+Al2O3
Al+MnO2=Mn+Al2O3
Al+Cr2O3=Cr+Al2O3
Al+V2O5=V+Al2O3
H2O2=O2+H2O
Ca(NO3)2+K2CO3=CaCO3+KNO3

* */
