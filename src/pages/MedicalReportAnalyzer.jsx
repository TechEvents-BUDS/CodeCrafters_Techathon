import React, { useState, useRef } from 'react';
import { FileText, Upload, Search, Stethoscope, BookOpen, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const MedicalReportAnalyzer = () => {
  const [reportFile, setReportFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [analysisResults, setAnalysisResults] = useState({
    fileType: '',
    fileSize: '',
    keyInformations: [],
    medicalTerms: [],
    potentialConditions: [],
    riskFactors: [],
    recommendations: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  // Medical terms and conditions dictionary
  const MEDICAL_TERMS = {
    conditions: [
      'diabetes', 'hypertension', 'cancer', 'heart disease', 
      'arthritis', 'asthma', 'depression', 'alzheimer\'s'
    ],
    riskFactors: [
      'obesity', 'smoking', 'alcohol', 'sedentary lifestyle', 
      'high cholesterol', 'family history'
    ]
  };

  // Parse different file types
  const parseFile = async (file) => {
    setIsAnalyzing(true);
    try {
      let content = '';
      const fileExtension = file.name.split('.').pop().toLowerCase();

      // File type specific parsing
      switch (fileExtension) {
        case 'txt':
          content = await parseTextFile(file);
          break;
        case 'csv':
          content = await parseCSV(file);
          break;
        case 'xlsx':
        case 'xls':
          content = await parseExcel(file);
          break;
        default:
          throw new Error('Unsupported file type. Please use TXT, CSV, or Excel files.');
      }

      setFileContent(content);
      performDetailedAnalysis(content);
    } catch (error) {
      console.error('File parsing error:', error);
      alert('Error parsing file: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Parse text file
  const parseTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // Parse CSV file
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve(results.data.map(row => row.join(' ')).join('\n'));
        },
        error: (error) => reject(error)
      });
    });
  };

  // Parse Excel file
  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        let content = '';
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          content += XLSX.utils.sheet_to_csv(worksheet);
        });
        resolve(content);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  // Detailed medical report analysis
  const performDetailedAnalysis = (content) => {
    const lowerContent = content.toLowerCase();

    // Extract key information
    const keyInformations = extractKeyInformations(content);

    // Identify medical terms
    const medicalTerms = MEDICAL_TERMS.conditions.filter(term => 
      lowerContent.includes(term.toLowerCase())
    );

    // Identify potential conditions
    const potentialConditions = medicalTerms.map(condition => ({
      name: condition,
      confidence: calculateConfidence(lowerContent, condition)
    }));

    // Identify risk factors
    const riskFactors = MEDICAL_TERMS.riskFactors.filter(factor => 
      lowerContent.includes(factor.toLowerCase())
    );

    // Generate recommendations
    const recommendations = generateRecommendations(medicalTerms, riskFactors);

    setAnalysisResults({
      fileType: reportFile.type,
      fileSize: `${(reportFile.size / 1024).toFixed(2)} KB`,
      keyInformations,
      medicalTerms,
      potentialConditions,
      riskFactors,
      recommendations
    });
  };

  // Extract key informations
  const extractKeyInformations = (content) => {
    const keyPatterns = [
      { label: 'Patient Name', regex: /patient\s*name[:\s]*([^\n]+)/i },
      { label: 'Age', regex: /age[:\s]*(\d+)/i },
      { label: 'Gender', regex: /gender[:\s]*([^\n]+)/i },
      { label: 'Date', regex: /date[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i }
    ];

    return keyPatterns.map(pattern => {
      const match = content.match(pattern.regex);
      return {
        label: pattern.label,
        value: match ? match[1].trim() : 'Not Found'
      };
    });
  };

  // Calculate condition confidence
  const calculateConfidence = (content, term) => {
    const termCount = (content.match(new RegExp(term, 'gi')) || []).length;
    return Math.min(termCount * 20, 100); // Max 100% confidence
  };

  // Generate medical recommendations
  const generateRecommendations = (conditions, riskFactors) => {
    const recommendations = [];

    if (conditions.length > 0) {
      recommendations.push(`Consult a specialist for detailed evaluation of: ${conditions.join(', ')}`);
    }

    if (riskFactors.length > 0) {
      recommendations.push(`Consider lifestyle modifications to address risk factors: ${riskFactors.join(', ')}`);
      recommendations.push('Recommend comprehensive health check-up and personalized health plan');
    }

    if (recommendations.length === 0) {
      recommendations.push('No specific recommendations based on the current report');
    }

    return recommendations;
  };

  // File upload handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setReportFile(file);
      parseFile(file);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center">
          <Stethoscope className="mr-3" />
          <h1 className="text-xl font-bold">Medical Report Analyzer</h1>
        </div>

        {/* File Upload */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.csv,.xlsx,.xls"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              <Upload className="mr-2" /> Upload Medical Report
            </button>
            {reportFile && (
              <span className="ml-4 text-green-600">
                {reportFile.name} - {(reportFile.size / 1024).toFixed(2)} KB
              </span>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {isAnalyzing ? (
          <div className="p-6 text-center">
            <div className="animate-pulse">Analyzing report...</div>
          </div>
        ) : analysisResults.medicalTerms.length > 0 ? (
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Key Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <BookOpen className="mr-2" /> Key Information
                </h2>
                <div className="bg-gray-50 p-4 rounded">
                  {analysisResults.keyInformations.map((info, index) => (
                    <div key={index} className="mb-2">
                      <strong>{info.label}:</strong> {info.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Potential Conditions */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertCircle className="mr-2 text-red-500" /> Potential Conditions
                </h2>
                <div className="bg-gray-50 p-4 rounded">
                  {analysisResults.potentialConditions.map((condition, index) => (
                    <div key={index} className="mb-2">
                      <strong>{condition.name}</strong>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{width: `${condition.confidence}%`}}
                        ></div>
                      </div>
                      <small>{condition.confidence}% Confidence</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Search className="mr-2 text-yellow-500" /> Risk Factors
                </h2>
                <div className="bg-gray-50 p-4 rounded">
                  {analysisResults.riskFactors.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {analysisResults.riskFactors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No specific risk factors identified</p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FileText className="mr-2 text-green-500" /> Recommendations
                </h2>
                <div className="bg-gray-50 p-4 rounded">
                  <ul className="list-disc list-inside">
                    {analysisResults.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : reportFile ? (
          <div className="p-6 text-center text-gray-500">
            No significant medical information found in the report.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MedicalReportAnalyzer;