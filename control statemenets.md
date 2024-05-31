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
            let intepreter = new Intepreter()
            root.accept(intepreter)
        }

        expect(codeToParse).not.toThrow();
    })
})
```
In the above code, we add a new test suit and add a test case to check parser can understand the if..else.. statement, run the test and make sure it fails. Then we can add code to make the case
passed, add the following code to recursive_decent_parser.js:
```

```
