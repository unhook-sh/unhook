class Unhook < Formula
  desc "CLI tool for managing webhooks"
  homepage "https://github.com/seawatts/webhook"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/seawatts/webhook/releases/download/v#{version}/unhook-darwin-arm64"
      sha256 "SKIP" # Will be updated automatically by the bump-homebrew-formula-action
    else
      url "https://github.com/seawatts/webhook/releases/download/v#{version}/unhook-darwin-x64"
      sha256 "SKIP" # Will be updated automatically by the bump-homebrew-formula-action
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      if OS.alpine?
        url "https://github.com/seawatts/webhook/releases/download/v#{version}/unhook-linux-arm64-musl"
        sha256 "SKIP"
      else
        url "https://github.com/seawatts/webhook/releases/download/v#{version}/unhook-linux-arm64"
        sha256 "SKIP"
      end
    else
      if OS.alpine?
        url "https://github.com/seawatts/webhook/releases/download/v#{version}/unhook-linux-x64-musl"
        sha256 "SKIP"
      else
        url "https://github.com/seawatts/webhook/releases/download/v#{version}/unhook-linux-x64"
        sha256 "SKIP"
      end
    end
  end

  def install
    if OS.mac?
      if Hardware::CPU.arm?
        bin.install "unhook-darwin-arm64" => "unhook"
      else
        bin.install "unhook-darwin-x64" => "unhook"
      end
    else
      if Hardware::CPU.arm?
        if OS.alpine?
          bin.install "unhook-linux-arm64-musl" => "unhook"
        else
          bin.install "unhook-linux-arm64" => "unhook"
        end
      else
        if OS.alpine?
          bin.install "unhook-linux-x64-musl" => "unhook"
        else
          bin.install "unhook-linux-x64" => "unhook"
        end
      end
    end
  end

  test do
    system "#{bin}/unhook", "--version"
  end
end