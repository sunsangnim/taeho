#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <cstdio>
#include <cstdlib> // std::system

// whisper.cpp ��� (������ �� include path ���� �ʿ�)
#include "whisper.h"

using namespace std;

// --- [����ü ����] ---
struct SubtitleSegment {
    int64_t t0; // ���� �ð� (10ms ����)
    int64_t t1; // ���� �ð� (10ms ����)
    std::string text;
};

// --- [1. ��ƿ��Ƽ: �ð� ��ȯ (SRT ����)] ---
// ��: 00:00:01,500
std::string to_srt_timestamp(int64_t t) {
    int64_t msec = t * 10;
    int64_t hr = msec / 3600000;
    msec %= 3600000;
    int64_t min = msec / 60000;
    msec %= 60000;
    int64_t sec = msec / 1000;
    msec %= 1000;

    std::stringstream ss;
    ss << std::setfill('0') << std::setw(2) << hr << ":"
        << std::setw(2) << min << ":"
        << std::setw(2) << sec << ","
        << std::setw(3) << msec;
    return ss.str();
}

// --- [2. ��� ����: ����� ���� (FFmpeg)] ---
bool ExtractAudio(const std::string& videoPath, const std::string& audioPath) {
    std::cout << "[Step 1] ����� ���� �� (FFmpeg)..." << std::endl;
    // Whisper�� 16kHz, 16bit, Mono PCM WAV�� �ʿ��մϴ�.
    std::string cmd = "ffmpeg -y -i \"" + videoPath + "\" -ar 16000 -ac 1 -c:a pcm_s16le \"" + audioPath + "\" > nul 2>&1";

    int ret = std::system(cmd.c_str());
    if (ret != 0) {
        std::cerr << "����: FFmpeg ���� ����. FFmpeg�� ��ġ�Ǿ� �ִ��� Ȯ���ϼ���." << std::endl;
        return false;
    }
    return true;
}

// --- [3. ��� ����: WAV ���� �ε�] ---
bool ReadWav(const std::string& fname, std::vector<float>& pcmf32) {
    std::ifstream file(fname, std::ios::binary);
    if (!file.is_open()) return false;

    file.seekg(0, std::ios::end);
    size_t fileSize = file.tellg();
    file.seekg(44, std::ios::beg); // WAV ��� �ǳʶٱ�

    size_t numSamples = (fileSize - 44) / 2;
    pcmf32.resize(numSamples);

    std::vector<int16_t> pcm16(numSamples);
    file.read((char*)pcm16.data(), numSamples * 2);

    for (size_t i = 0; i < numSamples; i++) {
        pcmf32[i] = static_cast<float>(pcm16[i]) / 32768.0f;
    }
    return true;
}

// --- [4. ��� ����: Whisper STT ����] ---
std::vector<SubtitleSegment> RunWhisper(const std::string& wavPath, const std::string& modelPath) {
    std::cout << "[Step 2] Whisper ���� �ν� ����..." << std::endl;
    std::vector<SubtitleSegment> segments;

    whisper_context_params cparams = whisper_context_default_params();
    cparams.use_gpu = false;
    struct whisper_context* ctx = whisper_init_from_file_with_params(modelPath.c_str(), cparams);
    if (!ctx) {
        std::cerr << "�� �ε� ���� (" << modelPath << ")" << std::endl;
        return segments;
    }

    std::vector<float> pcmf32;
    if (!ReadWav(wavPath, pcmf32)) {
        std::cerr << "WAV ���� �б� ����" << std::endl;
        whisper_free(ctx);
        return segments;
    }

    whisper_full_params wparams = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    wparams.print_progress = false;
    wparams.language = "ko"; // �ѱ��� ���� ���� (auto�� ���� ����)

    if (whisper_full(ctx, wparams, pcmf32.data(), pcmf32.size()) != 0) {
        std::cerr << "Whisper �߷� ����" << std::endl;
        whisper_free(ctx);
        return segments;
    }

    const int n_segments = whisper_full_n_segments(ctx);
    for (int i = 0; i < n_segments; ++i) {
        SubtitleSegment seg;
        seg.t0 = whisper_full_get_segment_t0(ctx, i);
        seg.t1 = whisper_full_get_segment_t1(ctx, i);
        seg.text = whisper_full_get_segment_text(ctx, i);
        segments.push_back(seg);

        // ���� ��Ȳ ���
        std::cout << "[" << to_srt_timestamp(seg.t0) << "] " << seg.text << std::endl;
    }

    whisper_free(ctx);
    return segments;
}

// --- [5. ��� ����: SRT ���� ����] ---
void SaveSRT(const std::vector<SubtitleSegment>& segments, const std::string& filename) {
    std::cout << "[Step 3] �ڸ� ����(SRT) ����: " << filename << std::endl;
    std::ofstream outfile(filename);
    int index = 1;
    for (const auto& seg : segments) {
        outfile << index++ << "\n";
        outfile << to_srt_timestamp(seg.t0) << " --> " << to_srt_timestamp(seg.t1) << "\n";
        outfile << seg.text << "\n\n";
    }
    outfile.close();
}

// --- [6. ��� ����: ���� ������ (FFmpeg Subtitles Filter)] ---
bool RenderVideoWithFFmpeg(const std::string& inputVideo, const std::string& srtPath, const std::string& outputVideo) {
    std::cout << "[Step 4] �ڸ� ���� ������ (FFmpeg)..." << std::endl;

    // FFmpeg ���ɾ� ����
    // -vf subtitles=output.srt : �ڸ��� ���� �ϵ��ڵ�(Burning)
    // force_style �ɼ����� ��Ʈ�� ũ�⸦ ������ �� �ֽ��ϴ�. (�ʿ� �� �߰�)

    std::string cmd = "ffmpeg -y -i \"" + inputVideo + "\" -vf \"subtitles=" + srtPath + "\" -c:a copy \"" + outputVideo + "\"";

    // �α׸� ���� ������ �Ʒ� �� �ּ� ����
    // cmd += " > ffmpeg_log.txt 2>&1"; 

    std::cout << "���� ����: " << cmd << std::endl;

    int ret = std::system(cmd.c_str());
    if (ret != 0) {
        std::cerr << "������ ����. SRT ���� ��ο� �����̳� Ư�����ڰ� �ִ��� Ȯ���ϼ���." << std::endl;
        return false;
    }
    return true;
}

// --- [Main �Լ�] ---
int main() {
    // ���� ����
    std::string videoFile = "input.mp4";       // �Է� ����
    std::string audioFile = "temp_audio.wav";  // �ӽ� �����
    std::string srtFile = "output.srt";      // ������ �ڸ�
    std::string finalFile = "final_output.mp4";// ��� ����
    std::string modelFile = "models/ggml-base.bin"; // �� ��� (�ʼ�!)

    // 1. ����� ����
    if (!ExtractAudio(videoFile, audioFile)) return -1;

    // 2. STT ����
    std::vector<SubtitleSegment> segments = RunWhisper(audioFile, modelFile);
    if (segments.empty()) {
        std::cout << "����� �ڸ��� �����ϴ�." << std::endl;
        return -1;
    }

    // (�ɼ�) ���� �Լ� ȣ�� ��ġ
    // TranslateSegments(segments); 

    // 3. SRT ����
    SaveSRT(segments, srtFile);

    // 4. FFmpeg�� �ڸ� �ռ�
    if (RenderVideoWithFFmpeg(videoFile, srtFile, finalFile)) {
        std::cout << "\n=== [����] ===" << std::endl;
        std::cout << "��� ����: " << finalFile << std::endl;
    }
    else {
        std::cout << "\n=== [����] ===" << std::endl;
    }

    // �ӽ� ���� ���� (����)
    // std::remove(audioFile.c_str());

    return 0;
}