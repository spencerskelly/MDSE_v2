#!/usr/bin/env bash
# Provision pinned experimental independent SysML parser. Must run in disposable CI workspace.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:?usage: provision_parser.sh OUTPUT_DIR}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"

VALIDATOR_COMMIT="63abbd9fbc7851dc437d01b2dc07836b919770b8"
PILOT_TAG="2026-04"
PILOT_ARTIFACT="0.59.0"

command -v git >/dev/null || { echo "Git required" >&2; exit 1; }
command -v mvn >/dev/null || { echo "Maven required" >&2; exit 1; }
command -v java >/dev/null || { echo "Java 21+ required" >&2; exit 1; }

git clone --quiet https://github.com/DeciSym/sysmlv2-validator.git "$OUT/sysmlv2-validator"
cd "$OUT/sysmlv2-validator"
git checkout --quiet --detach "$VALIDATOR_COMMIT"
test "$(git rev-parse HEAD)" = "$VALIDATOR_COMMIT"
grep -q '<sysml.release.tag>2026-07</sysml.release.tag>' pom.xml || { echo "Unexpected upstream pom contract" >&2; exit 1; }
grep -q '<sysml.artifact.version>0.61.0</sysml.artifact.version>' pom.xml || { echo "Unexpected upstream version default" >&2; exit 1; }

# System properties override Maven properties; never consume upstream 2026-07 defaults.
mvn -B -ntp -Dsysml.release.tag="$PILOT_TAG" -Dsysml.artifact.version="$PILOT_ARTIFACT" -Psetup-dependency initialize
mvn -B -ntp -Dsysml.release.tag="$PILOT_TAG" -Dsysml.artifact.version="$PILOT_ARTIFACT" package

JAR="$OUT/sysmlv2-validator/target/sysmlv2-validator-1.0.0-SNAPSHOT.jar"
PILOT_JAR="$OUT/sysmlv2-validator/target/sysml-download/sysml/jupyter-sysml-kernel-$PILOT_ARTIFACT-all.jar"
LIB="$OUT/sysmlv2-validator/target/sysml-download/sysml/sysml.library"
test -s "$JAR" && test -s "$PILOT_JAR" && test -d "$LIB"
sha256sum "$JAR" "$PILOT_JAR" > "$OUT/parser-sha256.txt"
printf 'validatorCommit=%s\npilotTag=%s\npilotVersion=%s\n' "$VALIDATOR_COMMIT" "$PILOT_TAG" "$PILOT_ARTIFACT" > "$OUT/parser-provenance.txt"
echo "Provisioned candidate parser; independent validation still must run and pass."
