"use client";

import { useState } from "react";

interface ParsedData {
  rows: string[][];
}

interface MCQData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  rationale: string;
  slug: string;
  tags: string;
  difficulty: string;
  positiveMarks: string;
}

const EXPECTED_HEADERS = [
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Answer",
  "Correct Answer Rationale",
  "Slug",
  "Tags",
  "Difficulty",
  "Postive Marks",
];

export default function Home() {
  const [inputData, setInputData] = useState("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mcqData, setMcqData] = useState<MCQData[]>([]);

  // Function to check if text contains special characters that need parsing
  const needsParsing = (text: string): boolean => {
    if (!text) return false;
    
    // Check if special characters are already properly wrapped in backticks
    const alreadyFormattedRegex = /`[^`]*[<>{}[\]()\/][^`]*`/;
    if (alreadyFormattedRegex.test(text)) {
      // Check if there are any unformatted special characters outside of backticks
      const textWithoutBackticks = text.replace(/`[^`]*`/g, '');
      const specialCharRegex = /[<>{}[\]()\/]/;
      return specialCharRegex.test(textWithoutBackticks);
    }
    
    // If no backticks found, check for special characters
    const specialCharRegex = /[<>{}[\]()\/]/;
    return specialCharRegex.test(text);
  };

  // Function to wrap special characters with backticks
  const formatSpecialCharacters = (text: string): string => {
    if (!text) return text;
    
    // Regular expression to find content within special characters
    const patterns = [
      /(\<[^>]*\>)/g,  // <content>
      /(\{[^}]*\})/g,  // {content}
      /(\[[^\]]*\])/g, // [content]
      /(\([^)]*\))/g,  // (content)
      /(\/[^\/\s]*\/)/g, // /content/ (paths or regex-like)
      /(\b\w*\/\w*\b)/g, // word/word patterns
    ];
    
    let formattedText = text;
    patterns.forEach(pattern => {
      formattedText = formattedText.replace(pattern, '`$1`');
    });
    
    return formattedText;
  };

  // Step 1: parse raw text
  const parseExcelData = (data: string): ParsedData | null => {
    if (!data.trim()) return null;
    const lines = data.trim().split("\n");

    const splitLine = (line: string) => {
      const tabSplit = line.split("\t");
      if (tabSplit.length > 1) return tabSplit;
      return line.split(/\s{2,}/).filter((cell) => cell.trim());
    };

    const rows = lines.map((line) => splitLine(line).map((c) => c.trim()));
    return { rows };
  };

  // Step 2: Convert to MCQData with special character formatting
  const parseMCQData = (parsed: ParsedData): MCQData[] => {
    return parsed.rows.map((row) => ({
      question: formatSpecialCharacters(row[0] || ""),
      optionA: formatSpecialCharacters(row[1] || ""),
      optionB: formatSpecialCharacters(row[2] || ""),
      optionC: formatSpecialCharacters(row[3] || ""),
      optionD: formatSpecialCharacters(row[4] || ""),
      correctAnswer: formatSpecialCharacters(row[5] || ""),
      rationale: formatSpecialCharacters(row[6] || ""),
      slug: row[7] || "",
      tags: row[8] || "",
      difficulty: row[9] || "",
      positiveMarks: row[10] || "",
    }));
  };

  const handlePreview = () => {
    const parsed = parseExcelData(inputData);
    setParsedData(parsed);
    setMcqData([]); // clear parsed MCQ until Parse clicked
  };

  const handleParse = () => {
    if (parsedData) {
      const mcqs = parseMCQData(parsedData);
      setMcqData(mcqs);
    }
  };

  const handleCopy = () => {
    if (!parsedData) return;
    navigator.clipboard.writeText(
      parsedData.rows.map((row) => row.join("\t")).join("\n")
    );
  };

  const handleCopyParsed = () => {
    if (mcqData.length === 0) return;
    
    // Create header row
    const headers = EXPECTED_HEADERS.join("\t");
    
    // Create data rows from parsed MCQ data
    const dataRows = mcqData.map(mcq => [
      mcq.question,
      mcq.optionA,
      mcq.optionB,
      mcq.optionC,
      mcq.optionD,
      mcq.correctAnswer,
      mcq.rationale,
      mcq.slug,
      mcq.tags,
      mcq.difficulty,
      mcq.positiveMarks
    ].join("\t"));
    
    // Combine headers and data
    const fullText = [headers, ...dataRows].join("\n");
    navigator.clipboard.writeText(fullText);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          MCQ Data Parser
        </h1>

        {/* Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Paste Excel Data</h2>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Paste MCQ data here..."
            className="w-full h-40 p-4 border border-gray-300 rounded-md font-mono text-sm"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handlePreview}
              disabled={!inputData.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              Preview
            </button>
            {parsedData && (
              <>
                <button
                  onClick={handleParse}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Parse
                </button>
                <button
                  onClick={handleCopy}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Copy
                </button>
              </>
            )}
          </div>
        </div>

        {/* Raw Preview Table */}
        {parsedData && !mcqData.length && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Preview Data</h2>

             <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
                  <span>Cells with special characters (will be formatted with backticks)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border rounded"></div>
                  <span>Invalid row (incorrect column count)</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {EXPECTED_HEADERS.map((header, i) => (
                      <th
                        key={i}
                        className="border px-4 py-2 text-left text-sm font-semibold text-gray-900"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.map((row, idx) => {
                    const isInvalid = row.length !== EXPECTED_HEADERS.length;
                    return (
                      <tr
                        key={idx}
                        className={`${
                          isInvalid ? "bg-red-50" : "hover:bg-gray-50"
                        }`}
                      >
                        {EXPECTED_HEADERS.map((_, j) => {
                          const cellValue = row[j] || "-";
                          const hasSpecialChars = needsParsing(cellValue);
                          return (
                            <td
                              key={j}
                              className={`border px-4 py-2 text-sm text-gray-900 ${
                                hasSpecialChars ? "bg-yellow-100" : ""
                              }`}
                              title={hasSpecialChars ? "Contains special characters that will be formatted" : ""}
                            >
                              {cellValue}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
           
          </div>
        )}

        {/* Parsed MCQ Cards */}
        {mcqData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Parsed MCQs ({mcqData.length})</h2>
              <button
                onClick={handleCopyParsed}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Copy for Excel
              </button>
            </div>
            
            <div className="space-y-6">
              {mcqData.map((mcq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{mcq.difficulty}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{mcq.positiveMarks} marks</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: mcq.question.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>') }} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">A) </span>
                      <span dangerouslySetInnerHTML={{ __html: mcq.optionA.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>') }} />
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">B) </span>
                      <span dangerouslySetInnerHTML={{ __html: mcq.optionB.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>') }} />
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">C) </span>
                      <span dangerouslySetInnerHTML={{ __html: mcq.optionC.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>') }} />
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">D) </span>
                      <span dangerouslySetInnerHTML={{ __html: mcq.optionD.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>') }} />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-800 font-medium">✓ Correct Answer:</span>
                      <span className="font-semibold text-green-900" dangerouslySetInnerHTML={{ __html: mcq.correctAnswer.replace(/`([^`]+)`/g, '<code class="bg-green-100 px-1 py-0.5 rounded text-xs">$1</code>') }} />
                    </div>
                    {mcq.rationale && (
                      <p className="text-green-800 text-sm" dangerouslySetInnerHTML={{ __html: mcq.rationale.replace(/`([^`]+)`/g, '<code class="bg-green-100 px-1 py-0.5 rounded text-xs">$1</code>') }} />
                    )}
                  </div>
                  
                  {(mcq.tags || mcq.slug) && (
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {mcq.slug && <span className="px-2 py-1 bg-gray-100 rounded">Slug: {mcq.slug}</span>}
                      {mcq.tags && <span className="px-2 py-1 bg-gray-100 rounded">Tags: {mcq.tags}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
