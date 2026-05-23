# Documentation Driven Development Template

> This README is available in English and Japanese. English speakers, please scroll down.

## 概要

このリポジトリは私が常用しているドキュメント駆動開発 *(Documentation Driven Development)* のテンプレートです。

開発サイクルはドキュメントと [TODO.md](TODO.md) によって構成されています。

人がサイクルを回すことも出来ますが、基本的には**Claude Codeなどのコーディングエージェント**が、この規則に従って自律的な開発を行うために設計されました。

**詳細については [ガイドライン](_docs/documentation_guide.md) を参照してください。**

初めて使う場合は、まず [Quickstart](QUICKSTART.md) を読んでください。

## 使用方法

1. このリポジトリをフォークまたはクローンします。
2. プロジェクトに合わせてドキュメントと設定ファイルを編集します。
3. 開発を開始します。

配布用 ZIP を作る場合は、`.git` / `.jj` などの VCS メタデータを含めないために、GitHub 標準アーカイブまたは `scripts/create-template-archive.sh` を使用してください。

### カスタマイズ

使用に当たっては、以下のファイルをプロジェクトに合わせてカスタマイズしてください。

#### AGENTS.md

変更の推奨事項はありませんが、特定コマンドの使用指示が含まれているので、必要に応じて編集してください。

#### README.md

このREADME自体も、プロジェクトに合わせて編集してください。

#### LICENSE.txt

[LICENSE](LICENSE.txt)についても、特に著作者の表示を編集してください。

## ライセンス

このリポジトリは [MITライセンス](LICENSE.txt) の下でライセンスされています。

---

## Summary

This repository is a template for Documentation Driven Development that I commonly use.

The development cycle is structured around documentation and [TODO.md](TODO.md).

While humans can run the cycle, it is primarily designed **for coding agents like Claude Code** to autonomously develop according to these rules.

**For more details, please refer to the [Guidelines](_docs/documentation_guide.md).**

If this is your first time using the template, start with the [Quickstart](QUICKSTART.md).

## Usage

1. Fork or clone this repository.
2. Edit the documentation and configuration files to suit your project.
3. Start development.

When creating a distribution ZIP, use GitHub's standard archive or `scripts/create-template-archive.sh` so VCS metadata such as `.git` / `.jj` is not included.

### Customization

When using this template, please customize the following files to fit your project.

#### AGENTS.md

No specific changes are recommended here, but feel free to edit it as needed, especially if you want to suggest the use of certain commands.

#### README.md

Feel free to edit this README itself to suit your project.

#### LICENSE.txt

Please edit the [LICENSE](LICENSE.txt) file, particularly the author attribution.

## License
This repository is licensed under the [MIT License](LICENSE.txt).
