import { useState, useEffect } from 'react';

function App() {
  // State management
  const [user, setUser] = useState(null);
  const [bots, setBots] = useState([]);
  const [wallets, setWallets] = useState({
    btc: "18FmB4VDrx4Gtj9ud547ci9HyD7q5TdaGW",
    eth: "0x3f8d463512f100b62e5d1f543be170acaeac8114",
    usdtBsc: "0x3f8d463512f100b62e5d1f543be170acaeac8114",
    usdcBsc: "0x3f8d463512f100b62e5d1f543be170acaeac8114"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [violations, setViolations] = useState([]);
  const [showViolationDetails, setShowViolationDetails] = useState(false);
  const [botLogs, setBotLogs] = useState([]);
  const [botStatus, setBotStatus] = useState("stopped");
  const [revenueMetrics, setRevenueMetrics] = useState({
    totalNgn: 0,
    walletMetrics: {},
    botMetrics: {}
  });

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check authentication status
        const authStatus = await checkAuthStatus();
        setUser(authStatus.user);
        
        // Load initial data
        await Promise.all([
          fetchBots(),
          fetchComplianceData(),
          fetchRevenueMetrics()
        ]);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to initialize application");
        setLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  // Authentication check
  const checkAuthStatus = async () => {
    // In a real app, this would call your authentication API
    return {
      user: {
        id: "user_123",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        apiKey: process.env.REACT_APP_USER_API_KEY || localStorage.getItem('user_api_key')
      }
    };
  };
  
  // Fetch bots
  const fetchBots = async () => {
    // In a real app, this would call your backend API
    const mockBots = [
      {
        id: "BN-X77",
        name: "Marketing Bot West Africa",
        region: "West Africa",
        role: "marketing",
        status: "active",
        lastRevenue: 125000,
        currency: "NGN",
        lastUpdated: new Date().toISOString()
      },
      {
        id: "BN-Y88",
        name: "Sales Bot Europe",
        region: "Europe",
        role: "sales",
        status: "active",
        lastRevenue: 89000,
        currency: "EUR",
        lastUpdated: new Date().toISOString()
      }
    ];
    
    setBots(mockBots);
    return mockBots;
  };
  
  // Fetch compliance data
  const fetchComplianceData = async () => {
    // In a real app, this would call your compliance API
    const summary = {
      total_violations: 0,
      recent_violations: 0,
      violation_types: {},
      severity_breakdown: {},
      current_compliance_score: 100,
      total_audits: 5,
      last_audit: new Date().toISOString(),
      strict_mode: true
    };
    
    setComplianceSummary(summary);
    setViolations([]);
    return summary;
  };
  
  // Fetch revenue metrics
  const fetchRevenueMetrics = async () => {
    // In a real app, this would call your revenue API
    const metrics = {
      totalNgn: 0,
      walletMetrics: {
        "18FmB4VDrx4Gtj9ud547ci9HyD7q5TdaGW": { total: 0, currency: "BTC", count: 0 },
        "0x3f8d463512f100b62e5d1f543be170acaeac8114": { total: 0, currency: "USDT", count: 0 }
      },
      botMetrics: {}
    };
    
    setRevenueMetrics(metrics);
    return metrics;
  };
  
  // Start bots
  const startBots = async () => {
    if (!process.env.REACT_APP_PAYSTACK_SECRET_KEY && !localStorage.getItem('paystack_secret_key')) {
      alert("Please set your Paystack secret key in the settings before starting bots");
      return;
    }
    
    setBotStatus("running");
    logBotActivity("Bots starting...");
    
    // Start bot interval
    const intervalId = setInterval(async () => {
      try {
        // Simulate bot activity
        await runBotCycle();
        
        // Update compliance status
        const complianceCheck = await checkCompliance();
        if (complianceCheck.violations_found.length > 0) {
          setViolations(complianceCheck.violations_found);
          setComplianceSummary({
            ...complianceSummary,
            total_violations: complianceSummary.total_violations + complianceCheck.violations_found.length,
            recent_violations: complianceSummary.recent_violations + complianceCheck.violations_found.length,
            current_compliance_score: complianceCheck.compliance_score,
            last_audit: complianceCheck.timestamp
          });
          
          complianceCheck.violations_found.forEach(violation => {
            logBotActivity(`Violation detected: ${violation.description}`, "error");
          });
          
          if (complianceCheck.violations_found.some(v => v.severity === "high")) {
            logBotActivity("High severity violation detected. Pausing bots.", "error");
            pauseBots(intervalId);
          }
        }
      } catch (error) {
        logBotActivity(`Error in bot cycle: ${error.message}`, "error");
        pauseBots(intervalId);
      }
    }, 10000); // Run every 10 seconds (adjust as needed)
    
    // Store interval ID for later cleanup
    setBotStatus({ status: "running", intervalId });
  };
  
  // Stop bots
  const stopBots = () => {
    if (botStatus.intervalId) {
      clearInterval(botStatus.intervalId);
      setBotStatus("stopped");
      logBotActivity("Bots stopped by user");
    }
  };
  
  // Pause bots
  const pauseBots = (intervalId = botStatus.intervalId) => {
    if (intervalId) {
      clearInterval(intervalId);
      setBotStatus("paused");
      logBotActivity("Bots paused due to compliance issues");
    }
  };
  
  // Run bot cycle
  const runBotCycle = async () => {
    logBotActivity("Starting new bot cycle");
    
    // Simulate bot activity
    const botResults = await Promise.all(bots.map(bot => runBot(bot)));
    
    // Process results
    let totalRevenue = 0;
    let updatedWallets = { ...revenueMetrics.walletMetrics };
    
    botResults.forEach(result => {
      if (result.success) {
        totalRevenue += result.amount;
        
        // Update wallet metrics
        if (updatedWallets[result.wallet]) {
          updatedWallets[result.wallet].total += result.amount;
          updatedWallets[result.wallet].count += 1;
        } else {
          updatedWallets[result.wallet] = {
            total: result.amount,
            currency: result.currency,
            count: 1
          };
        }
        
        // Update bot metrics
        setRevenueMetrics(prev => ({
          ...prev,
          botMetrics: {
            ...prev.botMetrics,
            [result.bot_id]: {
              total: (prev.botMetrics[result.bot_id]?.total || 0) + result.amount,
              currency: result.currency,
              role: result.role,
              region: result.region
            }
          }
        }));
        
        logBotActivity(`Bot ${result.bot_id} generated ${result.currency}${result.amount.toFixed(2)}`);
      }
    });
    
    // Update total revenue
    setRevenueMetrics(prev => ({
      ...prev,
      totalNgn: prev.totalNgn + totalRevenue,
      walletMetrics: updatedWallets
    }));
    
    logBotActivity(`Cycle completed. Total revenue: ₦${totalRevenue.toFixed(2)}`);
  };
  
  // Run individual bot
  const runBot = async (bot) => {
    try {
      // In a real app, this would make actual API calls to generate revenue
      // For demonstration, we're using simulated values
      const revenueAmount = Math.random() * 50000 + 50000; // Random between 50,000-100,000 NGN
      const currencies = ["NGN", "USD", "EUR"];
      const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      
      // Simulate API call to revenue generation service
      const revenueResult = {
        success: true,
        bot_id: bot.id,
        amount: revenueAmount,
        currency: randomCurrency,
        wallet: wallets.usdtBsc, // Using default wallet for this example
        role: bot.role,
        region: bot.region,
        timestamp: new Date().toISOString()
      };
      
      // Store in database (simulated)
      storeRevenueRecord(revenueResult);
      
      return revenueResult;
    } catch (error) {
      logBotActivity(`Error running bot ${bot.id}: ${error.message}`, "error");
      return { success: false, error: error.message };
    }
  };
  
  // Store revenue record
  const storeRevenueRecord = async (revenueData) => {
    // In a real app, this would call your backend API
    // For now, we'll update our local state
    setBotLogs(prev => [revenueData, ...prev]);
  };
  
  // Check compliance
  const checkCompliance = async () => {
    // In a real app, this would call your compliance API
    // For now, we'll simulate compliance checks
    
    // 5% chance of finding a violation
    if (Math.random() < 0.05) {
      const violationTypes = ["data_privacy", "advertising_ethics", "api_usage", "ai_ethics"];
      const severityLevels = ["medium", "high"];
      
      return {
        timestamp: new Date().toISOString(),
        violations_found: [{
          type: violationTypes[Math.floor(Math.random() * violationTypes.length)],
          severity: severityLevels[Math.floor(Math.random() * severityLevels.length)],
          description: "Potential compliance issue detected",
          rule_violated: "unknown",
          action_type: "ai_decision"
        }],
        compliance_score: Math.max(0, complianceSummary.current_compliance_score - 15),
        audit_id: `audit_${Date.now()}`
      };
    }
    
    return {
      timestamp: new Date().toISOString(),
      violations_found: [],
      compliance_score: complianceSummary.current_compliance_score,
      audit_id: `audit_${Date.now()}`
    };
  };
  
  // Log bot activity
  const logBotActivity = (message, level = "info") => {
    const timestamp = new Date().toLocaleString();
    const logEntry = { timestamp, level, message };
    
    setBotLogs(prev => [logEntry, ...prev]);
    
    // Also log to console
    if (level === "error") {
      console.error(`[${timestamp}] ${message}`);
    } else {
      console.log(`[${timestamp}] ${message}`);
    }
  };
  
  // Clear bot logs
  const clearBotLogs = () => {
    setBotLogs([]);
  };
  
  // Handle wallet address changes
  const updateWalletAddress = (type, address) => {
    setWallets(prev => ({
      ...prev,
      [type]: address
    }));
    alert(`Wallet address for ${type} updated`);
  };
  
  // Clear violations
  const clearViolations = async () => {
    if (window.confirm("Are you sure you want to clear all violations?")) {
      const clearedCount = violations.length;
      setViolations([]);
      setShowViolationDetails(false);
      logBotActivity(`Cleared ${clearedCount} violations`);
    }
  };
  
  // Get API keys from environment
  const getApiKeys = () => {
    return {
      paystack: process.env.REACT_APP_PAYSTACK_SECRET_KEY || localStorage.getItem('paystack_secret_key'),
      shopify: process.env.REACT_APP_SHOPIFY_API_KEY || localStorage.getItem('shopify_api_key'),
      aliexpress: process.env.REACT_APP_ALIEXPRESS_API_KEY || localStorage.getItem('aliexpress_api_key'),
      targetSite: process.env.REACT_APP_TARGET_SITE || localStorage.getItem('target_site')
    };
  };
  
  // Save API keys
  const saveApiKeys = (keys) => {
    if (keys.paystack) {
      localStorage.setItem('paystack_secret_key', keys.paystack);
    }
    if (keys.shopify) {
      localStorage.setItem('shopify_api_key', keys.shopify);
    }
    if (keys.aliexpress) {
      localStorage.setItem('aliexpress_api_key', keys.aliexpress);
    }
    if (keys.targetSite) {
      localStorage.setItem('target_site', keys.targetSite);
    }
    alert("API keys saved successfully");
  };
  
  // Get revenue for display
  const getRevenueDisplay = () => {
    const display = {};
    const conversionRates = { USD: 780.0, EUR: 850.0, NGN: 1.0 };
    
    Object.entries(revenueMetrics.walletMetrics).forEach(([address, data]) => {
      const ngnValue = data.total * conversionRates[data.currency || "NGN"];
      display[address] = { ...data, ngnValue };
    });
    
    return display;
  };
  
  // Format currency
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Ariel Matrix System...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Application Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Ariel Matrix System</h1>
              <p className="text-blue-100 mt-1">Autonomous Bot Network - Revenue Generation System</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500">
                {user.email}
              </span>
              <button
                onClick={() => alert("Settings")}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-colors text-sm font-medium"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* API Key Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">API Key Configuration</h2>
          
          <p className="text-gray-600 mb-6">
            Insert your API keys to enable revenue generation. These keys are stored securely in your browser.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paystack Secret Key</label>
              <div className="flex">
                <input
                  type="password"
                  defaultValue={localStorage.getItem('paystack_secret_key') || ""}
                  placeholder="sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={() => {
                    const key = document.querySelector("#paystackKey").value;
                    localStorage.setItem('paystack_secret_key', key);
                    alert("Paystack key saved");
                  }}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shopify API Key</label>
              <div className="flex">
                <input
                  type="password"
                  id="shopifyKey"
                  defaultValue={localStorage.getItem('shopify_api_key') || ""}
                  placeholder="shpss_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={() => {
                    const key = document.querySelector("#shopifyKey").value;
                    localStorage.setItem('shopify_api_key', key);
                    alert("Shopify key saved");
                  }}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AliExpress API Key</label>
              <div className="flex">
                <input
                  type="password"
                  id="aliexpressKey"
                  defaultValue={localStorage.getItem('aliexpress_api_key') || ""}
                  placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={() => {
                    const key = document.querySelector("#aliexpressKey").value;
                    localStorage.setItem('aliexpress_api_key', key);
                    alert("AliExpress key saved");
                  }}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Site URL</label>
              <div className="flex">
                <input
                  type="text"
                  id="targetSite"
                  defaultValue={localStorage.getItem('target_site') || ""}
                  placeholder="https://your-revenue-api.com "
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={() => {
                    const url = document.querySelector("#targetSite").value;
                    localStorage.setItem('target_site', url);
                    alert("Target site saved");
                  }}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wallet Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Wallet Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BTC Wallet</label>
              <div className="flex">
                <input
                  type="text"
                  defaultValue={wallets.btc}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  onChange={(e) => updateWalletAddress("btc", e.target.value)}
                />
                <button
                  onClick={() => alert("BTC wallet address updated")}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ethereum (ERC20)</label>
              <div className="flex">
                <input
                  type="text"
                  defaultValue={wallets.eth}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  onChange={(e) => updateWalletAddress("eth", e.target.value)}
                />
                <button
                  onClick={() => alert("ETH wallet address updated")}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">USDT (BEP20)</label>
              <div className="flex">
                <input
                  type="text"
                  defaultValue={wallets.usdtBsc}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  onChange={(e) => updateWalletAddress("usdtBsc", e.target.value)}
                />
                <button
                  onClick={() => alert("USDT wallet address updated")}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">USDC (BEP20)</label>
              <div className="flex">
                <input
                  type="text"
                  defaultValue={wallets.usdcBsc}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  onChange={(e) => updateWalletAddress("usdcBsc", e.target.value)}
                />
                <button
                  onClick={() => alert("USDC wallet address updated")}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Bot Controls</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Bot Status:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    botStatus === "running" ? "bg-green-100 text-green-800" : 
                    botStatus === "paused" ? "bg-yellow-100 text-yellow-800" : 
                    "bg-red-100 text-red-800"
                  }`}>
                    {botStatus === "running" ? "Running" : 
                     botStatus === "paused" ? "Paused" : "Stopped"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Compliance Score:</span>
                  <span className={`font-bold ${
                    complianceSummary?.current_compliance_score > 80 ? "text-green-500" :
                    complianceSummary?.current_compliance_score > 50 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {complianceSummary?.current_compliance_score || 100}/100
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Active Bots:</span>
                  <span className="font-bold text-blue-500">{bots.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Revenue Today:</span>
                  <span className="font-bold text-green-500">
                    ₦{revenueMetrics.totalNgn.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <button
                  onClick={startBots}
                  disabled={botStatus === "running"}
                  className={`w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md transition-colors font-medium ${
                    botStatus === "running" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {botStatus === "running" ? "Bots Running" : "Start Bots"}
                </button>
                
                <button
                  onClick={stopBots}
                  disabled={botStatus !== "running"}
                  className={`w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-md transition-colors font-medium ${
                    botStatus !== "running" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Stop Bots
                </button>
                
                <button
                  onClick={clearBotLogs}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-md transition-colors font-medium"
                >
                  Clear Logs
                </button>
              </div>
            </div>
            
            {/* Compliance Status */}
            {complianceSummary && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Compliance Status</h2>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Overall Compliance Score</span>
                    <span className="text-blue-600 font-bold">{complianceSummary.current_compliance_score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${complianceSummary.current_compliance_score}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Violations</span>
                    <span className="font-medium text-red-500">{complianceSummary.total_violations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recent Violations</span>
                    <span className="font-medium text-orange-500">{complianceSummary.recent_violations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Audits</span>
                    <span className="font-medium">{complianceSummary.total_audits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Audit</span>
                    <span className="font-medium">
                      {complianceSummary.last_audit ? 
                        new Date(complianceSummary.last_audit).toLocaleDateString() : 
                        "Never"}
                    </span>
                  </div>
                </div>
                
                {complianceSummary.total_violations > 0 && (
                  <button
                    onClick={() => setShowViolationDetails(!showViolationDetails)}
                    className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {showViolationDetails ? "Hide Violation Details" : "Show Violation Details"}
                  </button>
                )}
                
                {showViolationDetails && violations.length > 0 && (
                  <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                    <h3 className="font-medium text-gray-800 mb-2">Recent Violations</h3>
                    <ul className="space-y-2">
                      {violations.map((violation, index) => (
                        <li key={index} className={`p-2 rounded-md ${
                          violation.severity === "high" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                        }`}>
                          <div className="flex justify-between">
                            <span className="font-medium">{violation.type}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              violation.severity === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {violation.severity}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{violation.description}</p>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={clearViolations}
                      className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      Clear Violations
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right Column - Bots and Revenue */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Revenue Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-sm text-blue-700 font-medium">BTC Wallet</h3>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCurrency(
                      revenueMetrics.walletMetrics[wallets.btc]?.total || 0, 
                      revenueMetrics.walletMetrics[wallets.btc]?.currency || "BTC"
                    )}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md">
                  <h3 className="text-sm text-green-700 font-medium">ETH Wallet</h3>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(
                      revenueMetrics.walletMetrics[wallets.eth]?.total || 0, 
                      revenueMetrics.walletMetrics[wallets.eth]?.currency || "ETH"
                    )}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-md">
                  <h3 className="text-sm text-purple-700 font-medium">USDT Wallet</h3>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCurrency(
                      revenueMetrics.walletMetrics[wallets.usdtBsc]?.total || 0, 
                      revenueMetrics.walletMetrics[wallets.usdtBsc]?.currency || "USDT"
                    )}
                  </p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-md">
                  <h3 className="text-sm text-indigo-700 font-medium">USDC Wallet</h3>
                  <p className="text-xl font-bold text-indigo-900">
                    {formatCurrency(
                      revenueMetrics.walletMetrics[wallets.usdcBsc]?.total || 0, 
                      revenueMetrics.walletMetrics[wallets.usdcBsc]?.currency || "USDC"
                    )}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-800">Total Revenue</h3>
                  <span className="text-xl font-bold text-blue-900">
                    ₦{revenueMetrics.totalNgn.toFixed(2)}
                  </span>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, (revenueMetrics.totalNgn / 1000000) * 100}%` }}
                  ></div>
                </div>
                
                <p className="mt-1 text-sm text-gray-600 text-right">
                  Based on current exchange rates
                </p>
              </div>
            </div>
            
            {/* Bot Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Bot Status</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bot ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bots.map((bot) => (
                      <tr key={bot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bot.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bot.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bot.region}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            bot.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {bot.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(bot.lastRevenue, bot.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Bot Activity Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Bot Activity Logs</h2>
              
              <div className="bg-gray-50 rounded-md p-4 max-h-60 overflow-y-auto">
                {botLogs.length > 0 ? (
                  <ul className="space-y-2">
                    {botLogs.map((log, index) => (
                      <li 
                        key={index} 
                        className={`p-2 rounded text-sm ${
                          log.level === "error" ? "bg-red-50 text-red-700" : "bg-white text-gray-700"
                        }`}
                      >
                        <span className="text-gray-400 text-xs mr-2">{log.timestamp}</span>
                        {log.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No bot activity yet. Start your bots to see logs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6">
          <p>© {new Date().getFullYear()} Ariel Matrix System. All rights reserved.</p>
          <p className="mt-2">Autonomous Revenue Generation Network</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
