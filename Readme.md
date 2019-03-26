# php-undefined-vars-detector [Experimental]

Simple tool to detect undefined variables within a php script.

## Usage

* Install via `npm run i`
* Execute with node: `node ./dist/main.js`

```
Usage: main [options] <file>

Options:
  -g, --generate                Generate a view model
  -n, --classname [name]        Name of the class to generate
  -ns, --namespace [namespace]  Namespace of the class to generate
  -s, --save [file]             Save the generated view model as file
  -h, --help                    output usage information
```

Is the optional flag `-g` set the tool will generate a Class containing all detected undefined variables as 
attributes together with Getters and Setters.
