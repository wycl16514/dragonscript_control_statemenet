import Scanner from "../scanner/token"
import RunTime from "../runtime/runtime"
export default class Intepreter {

    constructor() {
        this.runTime = new RunTime()
    }

    attachEvalResult = (parent, node) => {
        parent.evalRes = node.evalRes
    }

    visitChildren = (node) => {
        for (const child of node.children) {
            child.accept(this)
        }
    }

    visitRootNode = (parent, node) => {
        this.visitChildren(node)
    }

    visitProgramNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitDeclarationRecursiveNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitBlockNode = (parent, node) => {
        this.runTime.addLocalEnv()
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
        this.runTime.removeLocalEnv()
    }


    visitVarDeclarationNode = (parent, node) => {
        this.visitChildren(node)
        //var a;
        let assignedVal = node.evalRes
        const variableName = node.attributes.value
        if (assignedVal === undefined) {
            //init value to null for unassigned variable
            assignedVal = {
                type: "NIL",
                value: "null",
            }
        }

        if (node.token.lexeme === "let") {
            this.runTime.bindLocalVariable(variableName, assignedVal)
        } else {
            this.runTime.bindGlobalVariable(variableName, assignedVal)
        }


        this.attachEvalResult(parent, node)
    }

    visitAssignmentNode = (parent, node) => {
        this.visitChildren(node)
        if (node.attributes) {
            const name = node.attributes.value
            const val = node.evalRes

            this.runTime.bindGlobalVariable(name, val)
        }
        this.attachEvalResult(parent, node)
    }

    visitStatementRecursiveNode = (parent, node) => {
        this.visitChildren(node)
        if (node.evalRes) {
            this.attachEvalResult(parent, node)
        }
    }

    visitPrintStatementNode = (parent, node) => {
        this.visitChildren(node)
        const exprEval = node.children[0].evalRes
        node.evalRes = {
            type: "print",
            value: exprEval.value,
        }
        //put the print content to the console of runtime
        this.runTime.outputConsole(exprEval.value)
        this.attachEvalResult(parent, node)
    }

    visitStatementNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    isEvalToTrue = (evalRes) => {
        if (evalRes.type === "number") {
            return evalRes.value > 0;
        }
        if (evalRes.type === "boolean") {
            return evalRes.value
        }

        return false
    }

    visitIfStmtNode = (parent, node) => {
        const condition = node.children[0]
        //evaluate the if condition
        condition.accept(this)
        if (this.isEvalToTrue(condition.evalRes)) {
            //condition is true then evalue the second child which is a block node
            const ifBlock = node.children[1]
            ifBlock.accept(this)
            node.evalRes = ifBlock.evalRes
        } else {
            //if there is else statement then evaluate it
            const elseBlock = node.children[2]
            if (elseBlock) {
                elseBlock.accept(this)
                node.evalRes = elseBlock.evalRes
            }
        }

        this.attachEvalResult(parent, node)
    }

    visitElseStmtNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitWhileNode = (parent, node) => {
        const condition = node.children[0]
        const body = node.children[1]
        while (true) {
            condition.accept(this)
            if (!this.isEvalToTrue(condition.evalRes)) {
                break
            }
            body.accept(this)
            node.evalRes = body.evalRes
        }
        this.attachEvalResult(parent, node)
    }

    visitForNode = (parent, node) => {
        let forInit = null
        let forChecking = null
        let forChanging = null
        let forBlock = null
        for (const child of node.children) {
            switch (child.name) {
                case "for_init":
                    forInit = child;
                    break
                case "for_checking":
                    forChecking = child
                    break
                case "for_changing":
                    forChanging = child
                    break
                case "block":
                    forBlock = child
                    break
            }
        }

        if (forInit) {
            forInit.accept(this)
        }

        while (true) {
            if (forChecking) {
                forChecking.accept(this)
                if (!this.isEvalToTrue(forChecking.evalRes)) {
                    break
                }
            }

            forBlock.accept(this)
            node.evalRes = forBlock.evalRes

            if (forChanging) {
                forChanging.accept(this)
            }
        }

        this.attachEvalResult(parent, node)
    }

    visitForInitNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitForCheckingNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitForChangingNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitLogicOrNode = (parent, node) => {
        for (const child of node.children) {
            child.accept(this)
            node.evalRes = child.evalRes
            if (this.isEvalToTrue(node.evalRes)) {
                break
            }
        }
        this.attachEvalResult(parent, node)
    }

    visitLogicAndNode = (parent, node) => {
        for (const child of node.children) {
            child.accept(this)
            node.evalRes = child.evalRes
            if (!this.isEvalToTrue(node.evalRes)) {
                break
            }
        }

        this.attachEvalResult(parent, node)
    }

    visitExpressionNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitEqualityNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitComparisonNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitEqualityRecursiveNode = (parent, node) => {
        this.visitChildren(node)
        const leftRes = node.children[0].evalRes
        const rightRes = node.children[1].evalRes

        this.typeIncompatibleError(leftRes, rightRes, node.attributes.value)

        const type = "boolean"
        if (leftRes.type === "nil" && rightRes.type === "nil") {
            node.evalRes = {
                type: type,
                value: true
            }
        } else {
            if (leftRes.type !== rightRes.type) {
                //nil and class instance in futhure
                throw new Error("only support equality comparison for the same type")
            }
            switch (node.attributes.value) {
                case "==":
                    node.evalRes = {
                        type: type,
                        value: leftRes.value === rightRes.value
                    }
                    break
                case "!=":
                    node.evalRes = {
                        type: type,
                        value: leftRes.value !== rightRes.value
                    }
                    break
                default:
                    throw new Error(`equality recursive for unkonwn operator ${node.attributes.value}`)
            }
        }

        this.attachEvalResult(parent, node)
    }

    visitComparisonRecursiveNode = (parent, node) => {
        this.visitChildren(node)
        const leftRes = node.children[0].evalRes
        const rightRes = node.children[1].evalRes

        this.typeIncompatibleError(leftRes, rightRes, node.attributes.value)

        const type = "boolean"
        switch (node.attributes.value) {
            case "<=":
                node.evalRes = {
                    type: type,
                    value: leftRes.value <= rightRes.value
                }
                break
            case "<":
                node.evalRes = {
                    type: type,
                    value: leftRes.value < rightRes.value
                }
                break
            case ">":
                node.evalRes = {
                    type: type,
                    value: leftRes.value > rightRes.value
                }
                break
            case ">=":
                node.evalRes = {
                    type: type,
                    value: leftRes.value >= rightRes.value
                }
                break
            default:
                throw new Error(`comparison recursive for unknown operator: ${node.attributes.value}`)
        }
        this.attachEvalResult(parent, node)
    }

    visitTermNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    typeIncompatibleError = (leftRes, rightRes, op) => {
        switch (op) {
            case "==":
            case "!=":
                if (leftRes.type !== rightRes.type) {
                    throw new Error(`binary operation on different type for ${leftRes.type} and ${rightRes.type} for operation ${op}`)
                }
                break
            case "*":
                if (leftRes.type !== "number" && rightRes.type !== "number") {
                    throw new Error(`binary operation on different type for ${leftRes.type} and ${rightRes.type} for operation ${op}`)
                }
                break
            case "-":
            case "/":
            case ">":
            case ">=":
            case "<":
            case "<=":
                if (leftRes.type !== "number" || rightRes.type !== "number") {
                    throw new Error(`binary operation on different type for ${leftRes.type} and ${rightRes.type} for operation ${op}`)
                }
                break
        }
    }

    visitTermRecursiveNode = (parent, node) => {
        this.visitChildren(node)

        const leftRes = node.children[0].evalRes
        const rightRes = node.children[1].evalRes
        this.typeIncompatibleError(leftRes, rightRes, node.attributes.value)

        let type = "number"
        switch (node.attributes.value) {
            case "+":
                if (leftRes.type === "number" && rightRes.type === "string") {
                    type = "string"
                    leftRes.value = leftRes.value.toString()
                }
                if (leftRes.type === "string" && rightRes.type === "number") {
                    type = "string"
                    rightRes.value = rightRes.value.toString()
                }
                node.evalRes = {
                    type: type,
                    value: leftRes.value + rightRes.value
                }
                break
            case "-":
                node.evalRes = {
                    type: type,
                    value: leftRes.value - rightRes.value
                }
                break
            default:
                throw new Error(`unknown operator for term_recursive: ${node.attributes.value}`)
        }

        this.attachEvalResult(parent, node)
    }

    visitFactorNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitFactorRecursiveNode = (parent, node) => {
        this.visitChildren(node)
        const leftRes = node.children[0].evalRes
        const rightRes = node.children[1].evalRes

        this.typeIncompatibleError(leftRes, rightRes, node.attributes.value)

        let type = "number"
        switch (node.attributes.value) {
            case "*":
                if (leftRes.type === "number" && rightRes.type === "string") {
                    type = "string"
                    node.evalRes = {
                        type: type,
                        value: rightRes.value.repeat(leftRes.value)
                    }
                } else if (leftRes.type === "string" && rightRes.type === "number") {
                    type = "string"
                    node.evalRes = {
                        type: type,
                        value: leftRes.value.repeat(rightRes.value)
                    }
                } else {
                    node.evalRes = {
                        type: type,
                        value: leftRes.value * rightRes.value
                    }
                }

                break
            case "/":
                node.evalRes = {
                    type: type,
                    value: leftRes.value / rightRes.value
                }
                break
            default:
                throw new Error(`unknown operator for factor_recursive: ${node.attributes.value}`)
        }

        this.attachEvalResult(parent, node)
    }

    visitUnaryNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitUnaryRecursiveNode = (parent, node) => {
        this.visitChildren(node)
        if (node.attributes.value === "-") {
            node.evalRes.value = -node.evalRes.value
        }
        if (node.attributes.value === "!") {
            if (node.evalRes.type === "NIL") {
                node.evalRes = {
                    type: "boolean",
                    value: true,
                }
            }
            else if (node.evalRes.type === "boolean") {
                if (node.evalRes.value === false) {
                    node.evalRes.value = true
                } else {
                    node.evalRes.value = false
                }
            } else {
                node.evalRes = {
                    type: "boolean",
                    value: false,
                }
            }
        }
        this.attachEvalResult(parent, node)
    }

    visitPrimaryNode = (parent, node) => {
        /*
        if the primary node is grouping, then we need to evaluae its child(expression)
        */
        if (node.attributes.value === "grouping") {
            this.visitChildren(node)
            this.attachEvalResult(parent, node)
            return
        }

        const token = node.token
        let type = undefined
        let value = undefined
        switch (token.token) {
            case Scanner.IDENTIFIER:
                const name = token.lexeme
                const val = this.runTime.getVariable(name)
                type = val.type
                value = val.value
                break
            case Scanner.NUMBER:
                type = "number"
                if (token.lexeme.indexOf(".") === -1) {
                    value = parseInt(token.lexeme)
                } else {
                    value = parseFloat(token.lexeme)
                }
                break
            case Scanner.STRING:
                type = "string"
                value = token.lexeme
                break
            case Scanner.TRUE:
                type = "boolean"
                value = true
                break
            case Scanner.FALSE:
                type = "boolean"
                value = false
                break
            case Scanner.NIL:
                type = "NIL"
                value = null
                break
        }

        parent.evalRes = {
            type: type,
            value: value,
        }
    }
}