#!/bin/bash

if ! command -v npm &> /dev/null
then
    echo "npm could not be found. It is required to install and build."
    read -p "Press enter to close the program..."
    exit
fi

if ! command -v tsc &> /dev/null
then
    echo "tsc could not be found. It is required to compile source files."
    
    echo ""
    read -p "Would you like to install 'typescript' now ? (y/n)" tscinstall
    
    case $tscinstall in
	    y|Y)
            echo ""
            echo "Installing typescript..."
            npm install -g typescript
            ;;
        *)
		    echo ""
		    echo "Please install the typescript manually globally with 'npm install -g typescript'"
		    echo ""
		    read -p "Press enter to close the program..."
		    exit
		    ;;
    esac
fi

if ! command -v node &> /dev/null
then
    echo "node could not be found. It is required to build"
    echo ""
    read -p "Would you like to install 'node' now ? (y/n)" nodeinstall
    
    case $nodeinstall in
	    y|Y)
            echo ""
            echo "Installing node..."
            npm install -g node
            ;;
        *)
		    echo ""
		    echo "Please install the typescript manually globally with 'npm install -g node'"
		    echo ""
		    read -p "Press enter to close the program..."
		    exit
		    ;;
    esac
fi

echo ""
echo "Installing packages..."
echo ""
npm install --verbose

echo ""
echo "Running npm build..."
echo ""
npm run build --verbose

echo ""
echo "Compiling source files with tsc..."
echo ""
tsc --build --verbose

while true ; do 
    case "$1" in
        --no-prompt)
    echo ""
            echo "Exiting..."
            echo ""
            sleep 3s
            exit 0
            ;;
        *)
            read -p "Press enter to close the program..."
            echo ""
            exit 0
            ;;
    esac
done