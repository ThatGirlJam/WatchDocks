import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Camera, MapPin } from "lucide-react";
import { useApp } from "../context/AppContext";

type ReportType = "witnessed" | "stolen" | "";

const ReportTheft: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [formStep, setFormStep] = useState<number>(1);
  const [reportType, setReportType] = useState<ReportType>("");
  const [location, setLocation] = useState<string>("");
  const [bikeDescription, setBikeDescription] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [incidentDetails, setIncidentDetails] = useState<string>("");
  // We store photoFile for potential future implementation of cloud upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [reportId, setReportId] = useState<string>("");

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file); // We're storing this for potential future upload
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate report ID (simplified version)
  const generateReportId = () => {
    return 'R-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);
  };

  // Submit the report
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("submitting");
    
    // Create a new report ID
    const newReportId = generateReportId();
    setReportId(newReportId);

    // In a real application, you would send this data to a server
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
      // Add the report to the app state
      dispatch({
        type: "ADD_THEFT_REPORT" as any, // Type assertion to fix lint error
        payload: {
          id: newReportId,
          type: reportType as 'witnessed' | 'stolen',
          location,
          bikeDescription,
          contactInfo,
          incidentDetails,
          photoUrl: photoPreview,
          timestamp: new Date(),
          status: "new" as const // Type assertion to ensure status is correctly typed
        }
      });
      
      setSubmitStatus("success");
      setFormStep(3); // Move to success page
    }, 1500);
  };

  // Reset form
  const resetForm = () => {
    setFormStep(1);
    setReportType("");
    setLocation("");
    setBikeDescription("");
    setContactInfo("");
    setIncidentDetails("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setSubmitStatus("idle");
  };

  // Navigate to dashboard
  const handleDashboardReturn = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Report Bike Theft
          </h1>
          <p className="mt-2 text-blue-100">
            Submit information about a bike theft you've witnessed or report your own stolen bike.
          </p>
        </div>

        {formStep === 1 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
              What would you like to report?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => {
                  setReportType("witnessed");
                  setFormStep(2);
                }}
                className={`flex flex-col items-center p-6 border-2 rounded-lg transition-all hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-900/30 ${reportType === 'witnessed' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white' : 'border-gray-200 dark:border-gray-700 dark:text-white'}`}
              >
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4 dark:ring-1 dark:ring-red-500/50">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                  I Witnessed a Theft
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                  Report suspicious activity or a theft in progress at a bike dock
                </p>
              </button>
              
              <button
                onClick={() => {
                  setReportType("stolen");
                  setFormStep(2);
                }}
                className={`flex flex-col items-center p-6 border-2 rounded-lg transition-all hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-900/30 ${reportType === 'stolen' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white' : 'border-gray-200 dark:border-gray-700 dark:text-white'}`}
              >
                <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full mb-4 dark:ring-1 dark:ring-orange-500/50">
                  <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                  My Bike Was Stolen
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                  Report that your bike has been stolen from a WatchDocks location
                </p>
              </button>
            </div>
          </div>
        )}

        {formStep === 2 && (
          <div className="p-6">
            <button 
              onClick={() => setFormStep(1)}
              className="text-blue-600 dark:text-blue-400 mb-4 flex items-center hover:underline"
            >
              ← Back to report types
            </button>
            
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
              {reportType === "witnessed" 
                ? "Report Witnessed Theft" 
                : "Report Your Stolen Bike"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location of Incident
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <select
                      className="block w-full rounded-r-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white py-2 px-3"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    >
                      <option value="">Select a location</option>
                      {state.cameras.map(camera => (
                        <option key={camera.id} value={camera.name}>
                          {camera.name}
                        </option>
                      ))}
                      <option value="Other">Other location (specify in details)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {reportType === "stolen" ? "Your Bike Description" : "Suspect/Bike Description"}
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white py-2 px-3"
                    placeholder={reportType === "stolen" ? "Describe your bike (color, make, model, distinguishing features)" : "Describe the suspect and/or the bike they were taking"}
                    value={bikeDescription}
                    onChange={(e) => setBikeDescription(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white py-2 px-3"
                    placeholder="Your name and phone number or email"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Incident Details
                  </label>
                  <textarea
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white py-2 px-3"
                    placeholder="Provide any additional details about the incident"
                    value={incidentDetails}
                    onChange={(e) => setIncidentDetails(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Photo Evidence (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <input 
                        type="file" 
                        className="sr-only" 
                        onChange={handlePhotoChange}
                        accept="image/*"
                      />
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Camera className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
                            Upload Photo
                          </span>
                        </div>
                      )}
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitStatus === "submitting"}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitStatus === "submitting" ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {formStep === 3 && (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center py-6">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4 dark:ring-1 dark:ring-green-500/50">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Report Submitted Successfully
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Thank you for reporting this incident. Your report has been received.
              </p>
              
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md mb-6 dark:border dark:border-gray-600">
                <span className="font-medium">Report ID: </span>
                <span className="font-mono">{reportId}</span>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                Please save this report ID for your records. Law enforcement may contact you for additional information. You'll be notified of any updates.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={resetForm}
                  className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900"
                >
                  Submit Another Report
                </button>
                
                <button
                  onClick={handleDashboardReturn}
                  className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTheft;
