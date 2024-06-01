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

After completing the code above, run the test and make sure it passed. There are somethings we need to think for the condition
of if else statement,we can use "or" and "and" to combie several conditions into one, let's check the test case first:
```js
it("should enable to parse logic operator or and", () => {
        let code = `
        var a = 1;
        var b = 2;
        var c = 3;
        var d = a>0 and b > 1 or c != 0;`

        let codeToParse = () => {
            createParsingTree(code)
        }

        expect(codeToParse).not.toThrow();
    })
```
As in above case, we need to decide the order for logic operator, how can we evaluate i(a>0 and b > 1 or c!=0)? The first way is
if ((a>0 and b > 1) or c !=0), the second way is if (a > 0 and (b>1 or c!=0)), which one we choose? we choose the first one that
is operator and has higer priority for operator "or", run the test and make sure it fails.

Now we define the grammar rule for logic operator "or" and "and" as following:

```js
  assignment -> IDENTIFIER EQUAL assign_to | logic_or
    logic_or -> logic_and logic_or_recursive
    logic_or_recursive -> OR logic_and logic_or_recursive| EPSILON
    logic_and -> equality logic_and_recursive
    logic_and_recurisve -> AND equaliaty logic_and_recurisve| EPSILON
```
From the aboved grammar rules, the assignment has two forms, one is assign vaule to a variable like "b=2;" the other is chainning
expression together with "or" or "and" keyword like "a > 0 or b < 2"

And the operator "and" has higher priority over "or" because the rule for "and" is lower than the rule for "or". 
And also notice that the rule for "or" and "and" is repetive, that is we can chain many expression with many "or" or
"and" operator like "a > 0 or b > 2 or c > 3"

Let's add code to enable parser to understand the "or" and "and" logic operator , first we add the "or" as a keyword in token.js:
```js
 initKeywords = () => {
    this.key_words = {
        "let": Scanner.LET,
        "and": Scanner.AND,
        "or": Scanner.OR,
             ...
         }
    }
       
```
Then we add code to implement the grammar rules at the parser as following:
```js
 /*
    assignment -> IDENTIFIER EQUAL assign_to | logic_or
    logic_or -> logic_and logic_or_recursive
    logic_or_recursive -> OR logic_and | EPSILON
    logic_and -> equality logic_and_recursive
    logic_and_recurisve -> AND equaliaty | EPSILON
    */

    assignment = (parentNode) => {
        /*
        check logic_or , the rule for logic_or can derivate to equality
        therefore we can replace the equality with the logic_or here
        */
        //this.equality(parentNode)
        this.logicOr(parentNode)
        if (this.matchTokens([Scanner.EQUAL])) {
            //assign_to -> EQUAL expression
            this.previous()
            const token = this.matchTokens([Scanner.IDENTIFIER])
            if (token) {
                let assignmentNode = this.createParseTreeNode(parentNode, "assignment")
                assignmentNode.attributes = {
                    value: token.lexeme
                }
                //over the identifier
                this.advance()
                //over the equal sign
                this.advance()
                const curToken = this.getToken()
                console.log(curToken)
                this.expression(assignmentNode)
                parentNode.children.push(assignmentNode)
            } else {
                throw new Error("can only assign to defined identifier")
            }
        } else {
            return
        }
    }

    logicOr = (parent) => {
        /*
         logic_or -> logic_and logic_or_recursive
         logic_or_recursive -> OR logic_and | EPSILON
        */
        const logicOrNode = this.createParseTreeNode(parent, "logic_or")
        parent.children.push(logicOrNode)
        this.logicAnd(logicOrNode)
        while (true) {
            //repeat if we check or keyword here
            let token = this.matchTokens([Scanner.OR])
            if (!token) {
                break
            }
            this.advance()
            this.logicAnd(logicOrNode)
        }
    }

    logicAnd = (parent) => {
        /*
         logic_and -> equality logic_and_recursive
         logic_and_recurisve -> AND equaliaty | EPSILON
        */
        const logicAndNode = this.createParseTreeNode(parent, "logic_and")
        parent.children.push(logicAndNode)
        this.equality(logicAndNode)
        while (true) {
            //repeat when we see the "and" keyword
            let token = this.matchTokens([Scanner.AND])
            if (!token) {
                break
            }
            this.advance()
            this.equality(logicAndNode)
        }
    }

   addAcceptForNode = (parent, node) => {
        switch (node.name) {
        ...
         case "logic_or":
                node.accept = (visitor) => {
                    visitor.visitLogicOrNode(parent, node)
                }
                break
            case "logic_and":
                node.accept = (visitor) => {
                    visitor.visitLogicAndNode(parent, node)
                }
                break
          ...
        }
        ...
    }
```
It is a little tricky in the parsing of assignment, originally when we go into assigment, we first do the equality parsing,
but this time we do the logic_or rule first, that's because we can goto the equality rule from the logic_or rule as :

logic_or -> logic_and -> equality

Since we have add two new nodes in the parsing tree, we need to add its vistor method for tree adjustor as following:
```js
  visitLogicOrNode = (parent, node) => {
        this.visitChildren(node)
    }

    visitLogicAndNode = (parent, node) => {
        this.visitChildren(node)
    }

```
And add the same visitor method at intepreter as following:
```js
  visitLogicOrNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }

    visitLogicAndNode = (parent, node) => {
        this.visitChildren(node)
        this.attachEvalResult(parent, node)
    }
```

After adding above code, let's check the parsing tree for command:

recursiveparsetree a > 0 or b < 1 and c > 2;

and we can see the following tree structure:

![截屏2024-06-01 13 55 47](https://github.com/wycl16514/dragonscript_control_statemenet/assets/7506958/c452bda4-fa1b-4186-9d72-7106f480719c)

Then run the test again and make sure it can be passed now. 

Let's see how to evaluate the two operators, for an expression that is composition of many expressions that are chained by and 
operator, it will evaluate to the first expression that is not truth otherwise it will evaluate to the result of last 
expression, let's check the test case for this: 
```js
it("should evaluate to the first expression of false otherwise evaluate to the last expression for and", () => {
        let code = `
        var a = 1;
        var b = 2;
        var c = 3;
        if (a > 0 and b > 1 and c > 4) {
            print(1);
        } else {
            print(2)
        }
        `

        let root = createParsingTree(code)
        let intepreter = new Intepreter()
        root.accept(intepreter)
        console = intepreter.runTime.console
        expect(console.length).toEqual(1)
        expect(console[0]).toEqual(2)

        code = `
        var a = 1;
        var b = 2;
        var c = 3;
        if (a > 0 and b > 1 and c > 2) {
            print(1);
        } else {
            print(2)
        }
        `

        root = createParsingTree(code)
        intepreter = new Intepreter()
        root.accept(intepreter)
        console = intepreter.runTime.console
        expect(console.length).toEqual(1)
        expect(console[0]).toEqual(1)
    })
```
Run the case above and make sure it fails, then we go to intepreter and add code to handle it as following:
```js
 visitLogicAndNode = (parent, node) => {
        for (const child of node.children) {
            child.accept(this)
            node.evalRes = child.evalRes
            //if one return false then give up the following
            if (!this.isEvalToTrue(child.evalRes)) {
                break
            }

        }
        this.attachEvalResult(parent, node)
    }
```
Now run the code and make sure the test case can be passed.
