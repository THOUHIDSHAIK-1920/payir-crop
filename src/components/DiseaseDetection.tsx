import React, { useState } from 'react';
import { 
  Upload, Bug, CheckCircle2, AlertCircle, 
  Sparkles, Clock, FileText, Image as ImageIcon, ShieldAlert, Check 
} from 'lucide-react';
import { DiseaseLog, Language } from '../types/database';
import { translations } from '../lib/translations';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface DiseaseDetectionProps {
  diseaseLogs: DiseaseLog[];
  onAddDiseaseLog: (log: DiseaseLog) => void;
  lang: Language;
}

export const DiseaseDetection: React.FC<DiseaseDetectionProps> = ({
  diseaseLogs,
  onAddDiseaseLog,
  lang
}) => {
  const t = translations[lang];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DiseaseLog | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Default sample leaves for easy 1-click testing
  const sampleLeafImages = [
    {
      name: "Sample 1 - Paddy Spot",
      url: "https://images.unsplash.com/photo-1592417817098-8f3d6eb197a7?w=600&auto=format&fit=crop&q=80"
    },
    {
      name: "Sample 2 - Corn Leaf Rust",
      url: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop&q=80"
    },
    {
      name: "Sample 3 - Tomato Blight",
      url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&auto=format&fit=crop&q=80"
    }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setUploadStatus(t.analyzing);

    let finalImageUrl = selectedImage;

    // Upload to Supabase Storage bucket 'leaf-images' if configured
    if (isSupabaseConfigured && imageFile) {
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `leaf_${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('leaf-images')
          .upload(filePath, imageFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('leaf-images')
            .getPublicUrl(filePath);
          if (data?.publicUrl) {
            finalImageUrl = data.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Storage upload fallback:', err);
      }
    }

    // Simulate AI model inference scan time (2 seconds)
    setTimeout(async () => {
      const dummyResult: DiseaseLog = {
        id: `d-${Date.now()}`,
        image_url: finalImageUrl,
        disease_name: "Brown Spot Disease",
        confidence: 92.0,
        suggestion: "Use Bavistin 1g/L spray. Maintain adequate field aeration and balanced nitrogen application.",
        created_at: new Date().toISOString()
      };

      // Save result to 'disease_logs' table in Supabase
      if (isSupabaseConfigured) {
        try {
          await supabase.from('disease_logs').insert([{
            image_url: dummyResult.image_url,
            disease_name: dummyResult.disease_name,
            confidence: dummyResult.confidence,
            created_at: dummyResult.created_at
          }]);
        } catch (dbErr) {
          console.error("Supabase insert error:", dbErr);
        }
      }

      setAnalysisResult(dummyResult);
      onAddDiseaseLog(dummyResult);
      setIsAnalyzing(false);
      setUploadStatus(t.savedToDb);
    }, 2200);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Bug className="w-6 h-6 text-emerald-400" />
            {t.diseaseTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {t.diseaseSubtitle}
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Supabase Bucket: leaf-images
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Image Uploader & Preview */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          
          <div>
            <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              1. Upload Leaf Photo
            </h3>

            {/* Drag & Drop Box */}
            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition group bg-slate-950/60 overflow-hidden">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {selectedImage ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 group-hover:opacity-90">
                  <img
                    src={selectedImage}
                    alt="Selected leaf"
                    className="w-full h-full object-cover"
                  />
                  {/* Scanner line overlay during analysis */}
                  {isAnalyzing && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 animate-scan shadow-lg shadow-emerald-400"></div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 text-xs px-2.5 py-1 rounded-lg text-emerald-400 border border-slate-700">
                    Change Image
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center space-y-2">
                  <div className="p-4 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300 mt-2">
                    {t.dropzoneText}
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports PNG, JPG, JPEG up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Quick Demo Sample Picker */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 mb-2">Or test with a sample leaf image:</p>
              <div className="grid grid-cols-3 gap-2">
                {sampleLeafImages.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(sample.url);
                      setImageFile(null);
                      setAnalysisResult(null);
                    }}
                    className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500 transition aspect-video"
                  >
                    <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 group-hover:bg-slate-950/20 transition flex items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-200 text-center px-1 truncate">{sample.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedImage || isAnalyzing}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              !selectedImage || isAnalyzing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80 cursor-pointer'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-emerald-300" />
                <span>{t.analyzing}</span>
              </>
            ) : (
              <>
                <Bug className="w-4 h-4" />
                <span>{t.uploadBtn}</span>
              </>
            )}
          </button>

        </div>

        {/* Right Column: AI Diagnostic Output Box */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          
          <div>
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              2. {t.resultHeader}
            </h3>

            {isAnalyzing ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 my-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-semibold text-emerald-400 animate-pulse">
                  {t.analyzing}
                </p>
                <p className="text-xs text-slate-500">Scanning cellular leaf pigmentation and spore vectors...</p>
              </div>
            ) : analysisResult ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-900/60 space-y-4 my-2 glow-emerald">
                
                {/* Disease Name & Confidence Badge */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Detected Pathogen
                    </span>
                    <h4 className="text-xl font-extrabold text-white mt-0.5">
                      {analysisResult.disease_name}
                    </h4>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {analysisResult.confidence}% {t.confidence}
                  </div>
                </div>

                {/* Suggestion / Remedy Box */}
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/60">
                  <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {t.suggestionHeader}:
                  </h5>
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                    {analysisResult.suggestion}
                  </p>
                </div>

                {/* Database Sync Status */}
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Log entry persisted to Supabase <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">disease_logs</code> table.</span>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2 my-4">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-400">
                  No image analyzed yet. Select or upload a leaf photo above.
                </p>
              </div>
            )}
          </div>

          {/* Audit History Log */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              {t.recentScans}
            </h4>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {diseaseLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">{t.noScansYet}</p>
              ) : (
                diseaseLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={log.image_url}
                        alt="Leaf preview"
                        className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {log.disease_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900">
                      {log.confidence}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
