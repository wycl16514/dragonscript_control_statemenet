export default class RunTime {
    constructor() {
        //console is a string buffer to receive output from print statement
        this.console = []
        /*
        globalEnv is used to record the binding of global variable
        */
        this.globalEnv = {}
        /*
        let will bind the identifier to local enviroment, each time the compiler
        go into a block, we will create a new enviroment object on localEnv,
        when evaluator go out of the block, we remove the top most env from
        localEnv, 

        if there is not socpe, then the current local enviroment is the 
        global enivroment
        */
        this.localEnv = [this.globalEnv]
    }

    addLocalEnv = () => {
        this.localEnv.push({})
    }

    bindLocalVariable = (name, value) => {
        const env = this.localEnv[this.localEnv.length - 1]
        env[name] = value
    }

    getVariable = (name) => {
        for (let i = this.localEnv.length - 1; i >= 0; i--) {
            if (this.localEnv[i][name]) {
                return this.localEnv[i][name]
            }
        }

        throw new Error(`undefined variable with name ${name}`)
    }

    removeLocalEnv = () => {
        if (this.localEnv.length > 1) {
            this.localEnv.pop()
        }
    }

    bindGlobalVariable = (name, value) => {
        this.globalEnv[name] = value
    }

    getGlobalVariableVal = (name) => {
        if (this.globalEnv[name] === null) {
            throw new Error(`undefined global variable with name ${name}`)
        }

        return this.globalEnv[name]
    }

    outputConsole = (content) => {
        this.console.push(content)
    }
}