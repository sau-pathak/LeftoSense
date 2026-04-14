import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { backendClient } from "@/api/backendClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginAuth() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = localStorage.getItem("leftosense_session");
    if (sessionData) {
      try {
        const { timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (now - timestamp < thirtyMinutes) {
          navigate("/Home");
        } else {
          localStorage.removeItem("leftosense_session");
        }
      } catch (e) {
        localStorage.removeItem("leftosense_session");
      }
    }
  }, [navigate]);

  const validatePin = (value) => {
    return /^\d{0,4}$/.test(value);
  };

  const handlePinChange = (e) => {
    const value = e.target.value;
    if (validatePin(value)) {
      setPin(value);
    }
  };

  const handleLogin = async () => {
    setError("");
    
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setLoading(true);
    
    try {
      const users = await backendClient.entities.AppUser.filter({ username: username.trim() });
      
      if (users.length === 0) {
        setError("Username not found");
        setLoading(false);
        return;
      }
      
      const user = users[0];
      
      if (user.pin !== pin) {
        setError("Incorrect PIN");
        setLoading(false);
        return;
      }
      
      await backendClient.entities.AppUser.update(user.id, {
        last_login: new Date().toISOString()
      });
      
      localStorage.setItem("leftosense_session", JSON.stringify({
        username: user.username,
        userId: user.id,
        timestamp: Date.now()
      }));
      
      navigate("/Home");
      
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
    
    setLoading(false);
  };

  const handleRegister = async () => {
    setError("");
    
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setLoading(true);
    
    try {
      const existingUsers = await backendClient.entities.AppUser.filter({ username: username.trim() });
      
      if (existingUsers.length > 0) {
        setError("Username already exists");
        setLoading(false);
        return;
      }
      
      const newUser = await backendClient.entities.AppUser.create({
        username: username.trim(),
        pin: pin,
        last_login: new Date().toISOString()
      });
      
      localStorage.setItem("leftosense_session", JSON.stringify({
        username: newUser.username,
        userId: newUser.id,
        timestamp: Date.now()
      }));
      
      navigate("/Home");
      
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Please try again.");
    }
    
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-10 h-10 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900">LeftoSense</h1>
          </div>
          <p className="text-gray-600">AI-powered food waste reduction</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4-Digit PIN
                </label>
                <Input
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full text-center text-2xl tracking-widest"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  "Please wait..."
                ) : mode === "login" ? (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setUsername("");
                  setPin("");
                }}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                {mode === "login" ? "New user? Create an account" : "Already have an account? Login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}