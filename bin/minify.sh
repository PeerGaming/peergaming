#! /bin/bash

INPUT="../dist/peergaming-0.1.0.js"
OUTPUT="../dist/peergaming-0.1.0.min.js"

if [ -r $INPUT ];

	then

		echo -en "\n:: Minification ::\n\n"
		curl  --progress-bar --data-urlencode "js_code@${INPUT}" --data "compilation_level=SIMPLE_OPTIMIZATIONS&output_info=compiled_code&output_format=text" http://closure-compiler.appspot.com/compile -o "${OUTPUT}"
		echo -en "\nOutput: ${OUTPUT}\n"

	else
		echo "Missing: ${INPUT} !"; exit 1;
fi;
