#include "window.h"

#define GLFW_EXPOSE_NATIVE_WIN32 1
#define GLFW_EXPOSE_NATIVE_WGL 1
#include <stdlib.h>
#include <stdio.h>
#include <fstream>
#include <string>
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <GLFW/glfw3native.h>

#include <bass.h>

using std::string;

GLuint shaderProgram;

// frag
GLint _Time;
GLint _Resolution;
GLint _FFT;

DWORD channel;
bool isPlaying = FALSE;
float fftData[128];
GLfloat fft[4];

int fftBands[4] = { 0, 3, 32, 64 };

GLuint loadShaders(const char *fileName)
{
    GLuint program;

    std::fstream fs;
    fs.open(fileName, std::fstream::in);
    string fragmentShaderSource;
    string line;
    while (getline(fs, line))
    {
        fragmentShaderSource.append(line);
        fragmentShaderSource.append("\n");
    }
    fs.close();

    const char* sourceString = fragmentShaderSource.c_str();

    program = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &sourceString);
    if (program == NULL)
        printf("Cannot compile %s", fileName);

    return program;
}

void initBass(HWND hwnd)
{
    BASS_Init(-1, 44100, 0, hwnd, NULL);

    BASS_SetConfig(BASS_CONFIG_DEV_DEFAULT, 1);
    channel = BASS_StreamCreateFile(FALSE, "maglev.mp3", 0, 0, 0);

    BASS_ChannelFlags(channel, BASS_SAMPLE_LOOP, BASS_SAMPLE_LOOP);
    BASS_ChannelPlay(channel, TRUE);
    isPlaying = TRUE;
}

void reloadShader()
{
    if (shaderProgram != NULL)
    {
        glDeleteProgram(shaderProgram);
    }

    shaderProgram = loadShaders("maglev.frag");
    _Time       = glGetUniformLocation(shaderProgram, "_Time");
    _FFT        = glGetUniformLocation(shaderProgram, "_FFT");
    _Resolution = glGetUniformLocation(shaderProgram, "_Resolution");
}

void onKeyPress(GLFWwindow* window, int keyCode, int scanCode, int action, int mods)
{
    if (keyCode == GLFW_KEY_F5 && action == GLFW_PRESS)
    {
        reloadShader();
    }
    else if (keyCode == GLFW_KEY_F3 && action == GLFW_PRESS)
    {
        isPlaying = !isPlaying;
        if (isPlaying)
        {
            BASS_ChannelPlay(channel, TRUE);
        }
        else
        {
            BASS_ChannelPause(channel);
        }
    }
    else if (keyCode == GLFW_KEY_ESCAPE && action == GLFW_PRESS)
    {
        exit(0);
    }
    else if (keyCode == GLFW_KEY_0 && action == GLFW_PRESS)
    {
        if (isPlaying)
        {
            QWORD mp = BASS_ChannelGetPosition(channel, BASS_POS_BYTE);
            double mt = BASS_ChannelBytes2Seconds(channel, mp);
            printf("%f", mt);
        }
    }
}

void getFFT()
{
    if (isPlaying)
    {
        int err = BASS_ChannelGetData(channel, fftData, BASS_DATA_FFT256 | BASS_DATA_FLOAT);
        if (err == -1)
        {
            printf("bass error: %d\n", BASS_ErrorGetCode());
        }
        else
        {
            for (int i = 0; i < 4; ++i)
            {
                fft[i] = fftData[fftBands[i]];
            }
        }
    }
}

void pass1(int width, int height)
{
    glUseProgram(shaderProgram);
    glViewport(0, 0, width, height);
    glClear(GL_COLOR_BUFFER_BIT);

    QWORD mp = BASS_ChannelGetPosition(channel, BASS_POS_BYTE);
    double mt = BASS_ChannelBytes2Seconds(channel, mp);
    getFFT();
    if (isPlaying)
    {
        glUniform1f(_Time, (float)mt);
    }
    else
    {
        glUniform1f(_Time, (float)glfwGetTime());
    }
    glUniform4f(_FFT, fft[0], fft[1], fft[2], fft[3]);
    glUniform2f(_Resolution, (float)width, (float)height);
    glRects(-1, -1, 1, 1);
}

int main(int argc, char** argv)
{
    GLFWwindow* window;
    int width = 0, height = 0;


    if (!glfwInit())
        return -1;

    window = glfwCreateWindow(800, 600, "MagLev", NULL, NULL);
    if (!window)
    {
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);

    glewInit();
    glfwSetKeyCallback(window, onKeyPress);

    reloadShader();

    initBass(glfwGetWin32Window(window));

    while (!glfwWindowShouldClose(window))
    {
        glfwGetFramebufferSize(window, &width, &height);

        pass1(width, height);

        glfwSwapBuffers(window);

        glfwPollEvents();
    }

    glfwTerminate();

    if (channel)
    {
        BASS_StreamFree(channel);
    }

    return 0;
}
