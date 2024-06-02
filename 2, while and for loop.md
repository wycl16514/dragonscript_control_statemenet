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
As grammar rule for while loop, its a special case for statement, it will begin with keyword "while" the following the left paren and right paren with a conditional expression in between, 
if the conditional expression evaluate to true then we need to execute the code indicated by the block.
evaluation for the con
