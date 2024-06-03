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
Run the test again and make sure it passed after adding the above code. Let's see how we can parse and evaluate the for loop, we still add the test case first:
```js
 it("should enable the parsing of for loop", () => {
        let code = `
        for(var i = 0; i < 10; i++) {
            print(i);
        }
        `
        let codeToParse = () => {
            createParsingTree(code)
        }

        expect(codeToParse).not.toThrow();

        code = `
        var i = 0;
        for(i = 1; i < 10; i++) {
            print(i);
        }
        `
        codeToParse = () => {
            createParsingTree(code)
        }

        expect(codeToParse).not.toThrow();

        code = `
        var i = 0;
        for(; ;) {
            print(i);
        }
        `
        codeToParse = () => {
            createParsingTree(code)
        }

        expect(codeToParse).not.toThrow();
    })
```
As we can see, the foor loop has three expressions in the parens, first is to ininitalize the looping condition, second is checking the condition still apply or not, the third one is change the looping
condition, then a block follow the for expression, run the test and make sure it fails.Now we add the grammar rule for the for loop as following:
```js
statement -> ...|forStmt
forStmt -> FOR LEFT_PAREN for_init for_checking for_changing RIGHT_PAREN block
for_init -> var_decl SEMICOLON| expressin SEMICOLN | SEMICOLON
for_checking -> expression SEMICOLON | SEMICOLN
for_changing -> expression  | EPSILON
```
pay attention to the grammar rule above, the loop_init, loop_checking and loop_changing can contain only one semicolon, and the loop changing can be empty, that's why we have a case that the condition
of the for loop only contains two semicolons, let's see how to use code to implement the for loop parsing:

```js
 statement = (parent) => {
    ....
     //get for keyword then goto parsing for statement
        token = this.matchTokens([Scanner.FOR])
        if (token) {
            this.advance()
            this.forStmt(stmtNode)
            parent.children.push(stmtNode)
            return
        }
    ....
}

forStmt = (parent) => {
        /*
        forStmt -> FOR LEFT_PAREN for_init for_checking for_changing RIGHT_PAREN block
        for_init -> var_decl SEMICOLON | expression SEMICOLON | SEMICOLON
        for_checking -> expression SEMICOLON | SEMICOLON
        for_changing -> expression SEMICOLON |SEMICOLON
        */
        const forStmtNode = this.createParseTreeNode(parent, "for")
        parent.children.push(forStmtNode)

        let token = this.matchTokens([Scanner.LEFT_PAREN])
        if (!token) {
            throw new Error("for loop missing left paren")
        }
        this.advance()

        //check the initiliazer is only semicolon
        token = this.matchTokens([Scanner.SEMICOLON])
        if (!token) {
            const forInitNode = this.createParseTreeNode(forStmtNode, "for_init")
            forInitNode.attributes = {
                name: "for_init"
            }
            forStmtNode.children.push(forInitNode)
            token = this.matchTokens([Scanner.VAR])
            if (token) {
                this.varDecl(forInitNode)
            } else {
                this.expression(forInitNode)
                token = this.matchTokens([Scanner.SEMICOLON])
                if (!token) {
                    throw new Error("for loop initializer misssing SEMICOLON")
                }
                this.advance()
            }
        } else {
            this.advance()
        }

        //check loop checking is only a semicolon
        token = this.matchTokens([Scanner.SEMICOLON])
        if (!token) {
            const forCheckingNode = this.createParseTreeNode(forStmtNode, "for_checking")
            forCheckingNode.attributes = {
                name: "for_checking"
            }
            forStmtNode.children.push(forCheckingNode)
            this.expression(forCheckingNode)
            token = this.matchTokens([Scanner.SEMICOLON])
            if (!token) {
                throw new Error("for loop checking misssing SEMICOLON")
            }
            this.advance()
        } else {
            this.advance()
        }

        //check there is for changing expression
        token = this.matchTokens([Scanner.RIGHT_PAREN])
        if (!token) {
            const forChanging = this.createParseTreeNode(forStmtNode, "for_changing")
            forChanging.attributes = {
                name: "for_changing"
            }
            forStmtNode.children.push(forChanging)
            this.expression(forChanging)
            token = this.matchTokens([Scanner.RIGHT_PAREN])
            if (!token) {
                throw new Error("loop initializer missing semicolon")
            }
            this.advance()
        } else {
            this.advance()
        }

        this.parseBlock(forStmtNode)
    }

   addAcceptForNode = (parent, node) => {
        switch (node.name) {
        ....
        case "for":
                node.accept = (visitor) => {
                    visitor.visitForNode(parent, node)
                }
                break
            case "for_init":
                node.accept = (visitor) => {
                    visitor.visitForInitNode(parent, node)
                }
                break
            case "for_checking":
                node.accept = (visitor) => {
                    visitor.visitForCheckingNode(parent, node)
                }
                break
            case "for_changing":
                node.accept = (visitor) => {
                    visitor.visitForChangingNode(parent, node)
                }
                break
          ....
        }
}
```
Since we add four new nodes, then we need to add the visitor methods for tree adjustor:
```js
visitForNode = (parent, node) => {
        this.visitChildren(node)
    }

    visitForInitNode = (parent, node) => {
        this.visitChildren(node)
    }

    visitForCheckingNode = (parent, node) => {
        this.visitChildren(node)
    }

    visitForChangingNode = (parent, node) => {
        this.visitChildren(node)
    }
```
And we need to add visitor methods for intepreter:
```js
 visitForNode = (parent, node) => {
        this.visitChildren(node)
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
```
Now let's check the parsing tree by using the following command:
```js
recursiveparsetree for(var i = 0; i < 10; i = i+1) {print(i);}
```
Then we get the parsing tree as following:

![截屏2024-06-03 13 42 23](https://github.com/wycl16514/dragonscript_control_statemenet/assets/7506958/95836d85-e471-4be9-a900-1d42601f60d1)

Pay attention to the parsing tree aboved, the first child of the for node is for_init, the second is for_checking, the third is for_changing, and the forth is the block for the code of the for loop,
we will use this info to do the evaluation. Runt the test again and make sure the new case can be passed. Now let's add the test case of for loop evaluation as following:
```js
it("should evaluate the for loop correctly", () => {
        let code = `
        for(var i = 0; i < 3; i=i+1) {
            print(i);
        }
        `
        let root = createParsingTree(code)
        let intepreter = new Intepreter()
        root.accept(intepreter)
        let console = intepreter.runTime.console
        expect(console.length).toEqual(3)
        expect(console[0]).toEqual(0)
        expect(console[1]).toEqual(1)
        expect(console[2]).toEqual(2)
    })
```
Run the test and make sure it fails, then we goto the intepreter to add code:
```js
visitForNode = (parent, node) => {
        let forInit = null
        let forChecking = null
        let forChanging = null
        let forBlock = null
        for (const child of node.children) {
            switch (child.name) {
                case "for_init":
                    forInit = child
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
            //init the condition for the for loop
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
```
After adding above code, run the test again and make sure it passed.
