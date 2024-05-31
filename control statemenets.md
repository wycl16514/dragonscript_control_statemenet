Until now, our intepreter can only do some arithmetic computation and it is not "turing complete". That means its no powerful enough to complete any tasks that other programming langagues can do.
In order to make it "turing complete", we need our intepreter to have jump and loop. Jump is actually conditional execution which is the if..else.. statement we have seen in many languages.

First we give the grammar rule for if..else statement as following:

```js
statement -> expression | ifStmt | printStmt | block
ifStmt -> IF LEFT_PAREN expression RIGHT_PAREN block elseStmt
elseStmt -> "else" block | EPSILON
```
From the aboved grammar rule, we can see the if statement is a special case of statement, it begins with keyword "if" then an expression in the pair of parents, then following a block, such as
the following code:
```js
if (isTrue()) {
    doSomething();
}
```
For the code piece aboved, "if" is the terminal token IF in the ifStmt rule, isTrue() is the expression in the ifStmt rule, { doSometing();} is the block in the ifStmt rule. A if statement may 
follow an else statement, if there is an else statement for the given if , then it will begin with if keyword, and a block following the else keyword. Let's add test case first for the if 
statement:
```js
describe("parsing and evaluating control statements", () => {
    const createParsingTree = (code) => {
        const parser = new RecursiveDescentParser(code)
        const root = parser.parse()
        const treeAdjustVisitor = new TreeAdjustVisitor()
        root.accept(treeAdjustVisitor)
        return root
    }

    it("should enable parsing if and else statement", () => {
        let code = `
            var a = 1;
            if (a>0) {
                a = 2;
            } else {
                a = 3;
            }
        `
        const codeToParse = () => {
            let root = createParsingTree(code)
        }

        expect(codeToParse).not.toThrow();
    })
})
```
In the above code, we add a new test suit and add a test case to check parser can understand the if..else.. statement, run the test and make sure it fails. Then we can add code to make the case
passed, add the following code to recursive_decent_parser.js:
```js
statement = (parent) => {
    ....
    
        //get if keyword then go to if statement parsing
        token = this.matchTokens([Scanner.IF])
        if (token) {
            this.advance()
            this.ifStmt(stmtNode)
            parent.children.push(stmtNode)
            return
        }
    ....
}

 parseBlock = (parent) => {
        let token = this.matchTokens([Scanner.LEFT_BRACE])
        if (token) {
            //over the left brace
            this.advance()
            this.block(parent)
            if (!this.matchTokens([Scanner.RIGHT_BRACE])) {
                throw new Error("Missing right brace for block")
            }
            //over the right brace
            this.advance()
        }
    }

    ifStmt = (parent) => {
        const ifNode = this.createParseTreeNode(parent, "if_stmt")
        parent.children.push(ifNode)
        //parsing expression condition with if
        let token = this.matchTokens([Scanner.LEFT_PAREN])
        if (!token) {
            throw new Error("Missing left parent after if")
        }
        this.advance()
        this.expression(ifNode)
        token = this.matchTokens([Scanner.RIGHT_PAREN])
        if (!token) {
            throw new Error("Missing right parent after if")
        }
        this.advance()

        //parsing block for if
        this.parseBlock(ifNode)

        //check else keyword
        token = this.matchTokens([Scanner.ELSE])
        if (token) {
            const elseNode = this.createParseTreeNode(ifNode, "else_stmt")
            ifNode.children.push(elseNode)
            this.advance()
            this.parseBlock(elseNode)
        }
    }
  addAcceptForNode = (parent, node) => {
        switch (node.name) {
        ....
         case "if_stmt":
                node.accept = (visitor) => {
                    visitor.visitIfStmtNode(parent, node)
                }
                break
            case "else_stmt":
                node.accept = (visitor) => {
                    visitor.visitElseStmtNode(parent, node)
                }
                break
        ....
        }
 }
```
In aboved code, when the parser is parsing the statement, it will check whether "if" is the beginning keyword, if it is, the parser will parse the if statement by using the parsing rule of
ifStmt, in ifStmt, it first parse the expression following the if keyword, them parse the code block that will execute if the given condition returns true, then it check whether there is 
keyword "else", if there is, it will parsing the block conrresponding to else.

Since we add new nodes in the parsing tree, we need to add the visit method to the tree adjustor :
```js
 visitIfStmtNode = (parent, node) => {
        this.visitChildren(node)
    }

    visitElseStmtNode = (parent, node) => {
        this.visitChildren(node)
    }
```

After having the aboved code, we get the parsing tree as following:

![截屏2024-05-31 16 20 56](https://github.com/wycl16514/dragonscript_control_statemenet/assets/7506958/fe272f37-3d35-445d-b15a-c6c449c850b9)

Now we can run the test again and make sure it can be passed. Since our parser can understand the if..else.. statement and we add code to intepreter to execute the if..else.. statement. According to the parsing tree,
the if_stmt node has three children, the first is expression, the second is the code block for if statement and if it has the third child, it will be code block for else statement. When executing the if..else.. 
statement, we first evaluate the expression and get its return, if the return is true, that is if the return is number and the number is larger than 0, if the return is boolean, then the value should be true, and
if the return type is NIL then the return valuse is false.

When the return value of the expression is true, then we execute its second child, otherwise we execute its third child if it has one, let's add the testing case first:
```js
 it("should evaluate if else statement correctly", () => {
        let code = `
        var a = 1;
        if (a>0) {
            print(1);
        } else {
           print(2);
        }
    `
        let root = createParsingTree(code)
        let intepreter = new Intepreter()
        root.accept(intepreter)
        let console = intepreter.runTime.console
        expect(console.length).toEqual(1)
        expect(console[0]).toEqual(1)

        code = `
        var a = 0;
        if (a>0) {
            print(1);
        } else {
           print(2);
        }
    `
        root = createParsingTree(code)
        intepreter = new Intepreter()
        root.accept(intepreter)
        console = intepreter.runTime.console
        expect(console.length).toEqual(1)
        expect(console[0]).toEqual(2)
    })
```
Run the test and make sure it fails, then we add code in intepreter.js to satisfy the test:

```js
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
        condition.accept(this)
        if (this.isEvalToTrue(condition.evalRes)) {
            //condition for if is true
            const ifBlock = node.children[1]
            ifBlock.accept(this)
            node.evalRes = ifBlock.evalRes
        } else {
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
```
In the visiIfStmtNode method, we first get its first child which is an expression node for the if condition, we evaluate it first and check its result, if the result is true(the truthness of the result is get by 
method isEvalToTrue), then we evaluate its second child which is the code block to execute when the if condition is true. If the condition evaluate to false, we check whether there is a third child, if it is, then
it is a block node for the else case, and we evaluate it.

After completing the code above, run the test and make sure it passed.
