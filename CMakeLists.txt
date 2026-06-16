cmake_minimum_required(VERSION 3.20)
project(AutoSubtitle LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# whisper.cpp를 서브디렉토리로 빌드
add_subdirectory(whisper.cpp-master)

add_executable(AutoSubtitle main.cpp)

target_link_libraries(AutoSubtitle PRIVATE whisper)

if (MSVC)
    target_compile_options(AutoSubtitle PRIVATE /utf-8)
endif()
