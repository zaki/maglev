CC=g++
CFLAGS=`pkg-config --cflags glfw3`
CLIBS=`pkg-config --libs glfw3`
CFRAMEWORKS=-framework OpenGL -framework Cocoa -framework IOKit -framework CoreVideo

all:
	$(CC) $(CFLAGS) $(CLIBS) $(CFRAMEWORKS) ./libbass.dylib -o maglev main.cpp

clean:
	rm *.o
	rm ./maglev
