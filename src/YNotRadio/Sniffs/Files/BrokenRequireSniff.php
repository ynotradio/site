<?php

/**
 * Detect broken or invalid require/include file paths.
 *
 * @author    Y-Not Radio
 * @license   MIT
 */

namespace YNotRadio\Sniffs\Files;

use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Files\File;

class BrokenRequireSniff implements Sniff
{
    /**
     * Returns an array of tokens this test wants to listen for.
     *
     * @return array
     */
    public function register()
    {
        return [
            T_REQUIRE,
            T_REQUIRE_ONCE,
            T_INCLUDE,
            T_INCLUDE_ONCE,
        ];
    }

    /**
     * Processes this test, when one of its tokens is encountered.
     *
     * @param \PHP_CodeSniffer\Files\File $phpcsFile The file being scanned.
     * @param int                         $stackPtr  The position of the current token in
     *                                               the stack passed in $tokens.
     *
     * @return void
     */
    public function process(File $phpcsFile, $stackPtr)
    {
        $tokens = $phpcsFile->getTokens();
        $fileName = $phpcsFile->getFilename();
        $currentDir = dirname($fileName);
        // Better way to find the src root - more reliable across different environments
        $srcRoot = realpath(dirname($fileName));
        while (basename($srcRoot) !== 'src' && dirname($srcRoot) !== $srcRoot) {
            $srcRoot = dirname($srcRoot);
        }
        // If we couldn't find /src directory, default to a reasonable guess
        if (basename($srcRoot) !== 'src') {
            $srcRoot = realpath(dirname($fileName, 5)); // Adjust based on deepest nesting level

            // Check if we're in the CP directory
            $inCpDir = (strpos($fileName, '/cp/') !== false);

            // Find the next non-whitespace token
            $nextToken = $phpcsFile->findNext(T_WHITESPACE, ($stackPtr + 1), null, true);

            if ($tokens[$nextToken]['code'] === T_OPEN_PARENTHESIS) {
                // Find the content within the parenthesis
                $contentStart = $phpcsFile->findNext(T_WHITESPACE, ($nextToken + 1), null, true);
                $contentEnd = $phpcsFile->findPrevious(T_WHITESPACE, ($tokens[$nextToken]['parenthesis_closer'] - 1), null, true);

                if ($contentStart <= $contentEnd) {
                    $content = $phpcsFile->getTokensAsString($contentStart, ($contentEnd - $contentStart + 1));

                    // Check if it's a string literal
                    if ($tokens[$contentStart]['code'] === T_CONSTANT_ENCAPSED_STRING) {
                        $path = trim($content, '\'"');

                        // Skip absolute URLs or dynamic paths
                        if (strpos($path, 'http') === 0 || strpos($path, '?') !== false) {
                            return;
                        }

                        // Calculate base paths for files in /cp directory
                        $baseDir = $inCpDir ? $srcRoot : $currentDir;

                        // Resolve path relative to the current file
                        $possiblePaths = [
                            $path,                              // Absolute path
                            $currentDir . '/' . $path,          // Relative to current file
                            $srcRoot . '/' . $path,             // Relative to src root
                            $srcRoot . '/' . ltrim($path, '../'),  // For "../path" from CP directory
                            realpath($srcRoot . '/../') . '/' . $path, // Relative to project root
                        ];

                        // For CP directory files, account for the special include patterns we observed
                        if ($inCpDir && strpos($path, '../') === false) {
                            $possiblePaths[] = $srcRoot . '/../' . $path; // Sometimes paths omit the ../
                            $possiblePaths[] = $currentDir . '/../' . $path; // Try parent directory
                        }

                        // Remove any duplicate paths
                        $possiblePaths = array_unique(array_filter($possiblePaths));

                        $fileExists = false;
                        $existingPath = '';

                        foreach ($possiblePaths as $testPath) {
                            if (file_exists($testPath)) {
                                $fileExists = true;
                                $existingPath = $testPath;
                                break;
                            }
                        }

                        if (!$fileExists) {
                            $error = 'Include/require file "%s" not found. Checked paths: %s';
                            $data = [
                                $path,
                                implode(', ', $possiblePaths),
                            ];
                            $phpcsFile->addError($error, $stackPtr, 'FileNotFound', $data);
                        } else {
                            // Warn about possible wrong path after directory reorganization
                            if ($inCpDir && strpos($path, '../') === false && strpos($path, '/') === 0) {
                                $suggestion = '../' . ltrim($path, '/');
                                $message = 'Path "%s" might need adjustment after CP directory reorganization. Consider using: %s';
                                $phpcsFile->addWarning(
                                    $message,
                                    $stackPtr,
                                    'PossiblePathAdjustment',
                                    [$path, $suggestion]
                                );
                            }
                        }
                    } elseif (
                        $tokens[$contentStart]['code'] === T_VARIABLE ||
                        $tokens[$contentStart]['code'] === T_STRING_CONCAT
                    ) {
                        // It's a variable or concatenation, we can't reliably check the path
                        $phpcsFile->addWarning(
                            'Include/require uses a dynamic path (%s). Cannot verify if file exists.',
                            $stackPtr,
                            'DynamicInclude',
                            [$content]
                        );
                    }
                }
            }
        }
    }
}
