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
    
    // Simple check for special characters that aren't already in backticks
    const specialChars = /[<>{}[\]()]/;
    
    // If no special characters at all, no parsing needed
    if (!specialChars.test(text)) return false;
    
    // Check if ALL special characters are already wrapped in backticks
    let tempText = text;
    // Remove all content within backticks
    tempText = tempText.replace(/`[^`]*`/g, '');
    
    // If special characters remain after removing backticked content, parsing is needed
    return specialChars.test(tempText);
  };

  // Function to wrap special characters with backticks

// Simple and robust formatting function - no nested backticks
const formatSpecialCharacters = (text: string): string => {
  if (!text) return text;
  
  // Manual approach to avoid regex lookbehind issues
  let result = '';
  let i = 0;
  let insideBackticks = false;
  
  while (i < text.length) {
    const char = text[i];
    
    // Track if we're inside backticks
    if (char === '`') {
      insideBackticks = !insideBackticks;
      result += char;
      i++;
      continue;
    }
    
    // If we're inside backticks, just copy everything as-is
    if (insideBackticks) {
      result += char;
      i++;
      continue;
    }
    
    // Check for special characters that need wrapping (only when NOT inside backticks)
    const specialPairs = {
      '{': '}',
      '<': '>',
      '[': ']',
      '(': ')'
    };
    
    if (specialPairs[char as keyof typeof specialPairs]) {
      const openChar = char;
      const closeChar = specialPairs[openChar as keyof typeof specialPairs];
      const start = i;
      i++; // move past opening character
      
      // Find matching closing character
      let depth = 1;
      let foundBacktick = false;
      
      while (i < text.length && depth > 0) {
        if (text[i] === '`') {
          foundBacktick = true;
          break;
        }
        if (text[i] === openChar) depth++;
        else if (text[i] === closeChar) depth--;
        i++;
      }
      
      if (depth === 0 && !foundBacktick) {
        // Found complete pair with no backticks inside, wrap it
        const content = text.substring(start, i);
        result += `\`${content}\``;
      } else {
        // Either no matching close found or contains backticks, treat as regular character
        result += openChar;
        i = start + 1;
      }
      continue;
    }
    
    // Regular character, just copy it
    result += char;
    i++;
  }
  
  return result;
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
    
    // Create data rows from parsed MCQ data (without headers)
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
    
    const dataText = dataRows.join("\n");
    navigator.clipboard.writeText(dataText);
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
          <div className="bg-white rounded-lg shadow-md p-6 mb-20">
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

        {/* Parsed MCQ Table */}
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
                  {mcqData.map((mcq, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 text-sm text-gray-900 max-w-xs">
                        <div 
                          className="truncate" 
                          title={mcq.question}
                          dangerouslySetInnerHTML={{ 
                            __html: mcq.question.replace(/`([^`]+)`/g, '<code class="bg-yellow-100 px-1 py-0.5 rounded text-xs">$1</code>') 
                          }} 
                        />
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900 max-w-xs">
                        <div 
                          className="truncate" 
                          title={mcq.optionA}
                          dangerouslySetInnerHTML={{ 
                            __html: mcq.optionA.replace(/`([^`]+)`/g, '<code class="bg-yellow-100 px-1 py-0.5 rounded text-xs">$1</code>') 
                          }} 
                        />
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900 max-w-xs">
                        <div 
                          className="truncate" 
                          title={mcq.optionB}
                          dangerouslySetInnerHTML={{ 
                            __html: mcq.optionB.replace(/`([^`]+)`/g, '<code class="bg-yellow-100 px-1 py-0.5 rounded text-xs">$1</code>') 
                          }} 
                        />
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900 max-w-xs">
                        <div 
                          className="truncate" 
                          title={mcq.optionC}
                          dangerouslySetInnerHTML={{ 
                            __html: mcq.optionC.replace(/`([^`]+)`/g, '<code class="bg-yellow-100 px-1 py-0.5 rounded text-xs">$1</code>') 
                          }} 
                        />
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900 max-w-xs">
                        <div 
                          className="truncate" 
                          title={mcq.optionD}
                          dangerouslySetInnerHTML={{ 
                            __html: mcq.optionD.replace(/`([^`]+)`/g, '<code class="bg-yellow-100 px-1 py-0.5 rounded text-xs">$1</code>') 
                          }} 
                        />
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900">
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: mcq.correctAnswer.replace(/`([^`]+)`/g, '<code class="bg-yellow-100 px-1 py-0.5 rounded text-xs">$1</code>') 
                          }} 
                        />
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900 max-w-xs">
                        <div 
                          className="truncate" 
                          title={mcq.rationale}
                          dangerouslySetInnerHTML={{ 
                            __html: mcq.rationale.replace(/`([^`]+)`/g, '<code class="bg-yellow-100 px-1 py-0.5 rounded text-xs">$1</code>') 
                          }} 
                        />
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900">
                        {mcq.slug}
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900">
                        {mcq.tags}
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900 text-center">
                        {mcq.difficulty}
                      </td>
                      <td className="border px-4 py-2 text-sm text-gray-900 text-center">
                        {mcq.positiveMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
