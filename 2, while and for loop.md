For turing complete, we need to enable loop for our language, that is we need to do given things continuously if the given condition is write. We add the while loop to our lanaugae first,
the following is the test case:
```js
it("should enable the parsing for while loop", () => {
        let code = `
        var a = 3;
        while(a > 0) {
            print(a);
            a = a-1;
        }
        `
        let codeToParse = () => {
            createParsingTree(code)
        }

        expect(codeToParse).not.toThrow();
    })
```
Run the test and make sure it fails. Then we add the grammar rule for while loop as following:
```js
statement -> expression | ifStmt | printStmt | whileStmt | block
whileStmt -> WHILE LEFT_PAREN expression RIGHT_PAREN block
```
As grammar rule for while loop, its a special case for statement, it will begin with keyword "while" the following the left paren and right paren with a conditional expression in between, if the conditional expression evaluate to true then we need to execute the code indicated by the block. Let's add code to enable the parser to parse the while loop as 
following:
```js
statement = (parent) => {
    ...
     //get while keyword, then goto while loop parsing
        token = this.matchTokens([Scanner.WHILE])
        if (token) {
            this.advance()
            this.whileStmt(stmtNode)
            parent.children.push(stmtNode)
            return
        }
    ...
}

 whileStmt = (parent) => {
        //whileStmt -> WHILE LEFT_PAREN expression RIGHT_PAREN block
        const whileNode = this.createParseTreeNode(parent, "while")
        parent.children.push(whileNode)
        let token = this.matchTokens([Scanner.LEFT_PAREN])
        if (!token) {
            throw new Error("condition for while loop missing left paren")
        }
        this.advance()

        this.expression(whileNode)

        token = this.matchTokens([Scanner.RIGHT_PAREN])
        if (!token) {
            throw new Error("condition for while loop missing right paren")
        }
        this.advance()

        this.parseBlock(whileNode)
    }

    addAcceptForNode = (parent, node) => {
        switch (node.name) {
        ...
        case "while":
            node.accept = (visitor) => {
                visitor.visitWhileNode(parent, node)
            }
         break
        ....
        }
}
```
Since we add new nodes , we need to add the visitor method for tree adjustor:
```js
 visitWhileNode = (parent, node) => {
        this.visitChildren(node)
    }
```
And add the same method to intepreter:
```js
visitWhileNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }
```
Now run the test and make sure it passed, and let's check its parsing tree:


![截屏2024-06-02 13 49 36](https://github.com/wycl16514/dragonscript_control_statemenet/assets/7506958/79f22a67-689e-49cc-8a45-5693eefb9b05)

From the aboved image of parsing tree, we can see that both expression and block are childs of while node, this will enable us to do the evaluation later. Now we can add test case for evaluation of while loop as following:
```js
it("should evaluate the while loop correctly", () => {
        let code = `
        var a = 3;
        while(a > 0) {
            print(a);
            a = a-1;
        }
        `
        let root = createParsingTree(code)
        let intepreter = new Intepreter()
        root.accept(intepreter)
        let console = intepreter.runTime.console
        expect(console.length).toEqual(3)
        expect(console[0]).toEqual(3)
        expect(console[1]).toEqual(2)
        expect(console[2]).toEqual(1)
    })
```
Run the test case aboved and make sure it fails. Now we add code to intepreter to make it passed:
```js
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
```
Run the test again and make sure it passed after adding the above code
