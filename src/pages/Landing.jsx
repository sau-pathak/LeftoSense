import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Leaf, Scan, TrendingDown, Heart, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900">LeftoSense</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#home" className="text-gray-600 hover:text-emerald-600 transition-colors">Home</a>
              <a href="#about" className="text-gray-600 hover:text-emerald-600 transition-colors">About</a>
              <a href="#media" className="text-gray-600 hover:text-emerald-600 transition-colors">Media</a>
              <a href="#contact" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact</a>
              <Link to="/LoginAuth">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Login to App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Reduce Food Waste with
              <span className="text-emerald-600"> AI Technology</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              LeftoSense uses advanced AI and computer vision to assess food freshness, 
              helping you make informed decisions and reduce food waste.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/LoginAuth">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mt-20"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Scan className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Scanning</h3>
              <p className="text-gray-600">
                Advanced CNN models analyze produce quality and detect spoilage signs instantly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingDown className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reduce Waste</h3>
              <p className="text-gray-600">
                Make informed decisions about food safety and extend the life of your produce.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Impact</h3>
              <p className="text-gray-600">
                Find donation centers and contribute to reducing food insecurity in your area.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">About the Creator</h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="rounded-2xl shadow-xl w-full h-full min-h-[320px] bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center p-8 text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">🌱</div>
                  <h3 className="text-3xl font-bold mb-2">Saumit Pathak</h3>
                  <p className="text-emerald-50">Student innovator building AI tools for sustainability and community impact.</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Saumit Pathak</h3>
                <p className="text-lg text-gray-600 mb-4">
                  High School Student | Silver Creek High School, San Jose, CA
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Saumit Pathak is a passionate high school student from Silver Creek High School in San Jose, California, 
                  driven by a deep commitment to addressing food waste and helping his community through innovative technology.
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  His love for food and concern about the global food waste crisis inspired him to combine his interests in 
                  artificial intelligence and computer science to create LeftoSense. This AI-powered solution helps individuals 
                  and families make informed decisions about food freshness, ultimately reducing waste and supporting local 
                  food banks.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Through LeftoSense, Saumit aims to empower communities with technology that makes a real difference, 
                  demonstrating how young innovators can tackle critical environmental and social challenges with creativity 
                  and technical expertise.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Media Section */}
      <section id="media" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Media & Recognition</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-emerald-200">
                <div className="mb-4 bg-gradient-to-br from-emerald-600 to-green-700 rounded-lg p-6 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-2">🏆</div>
                    <p className="text-white font-bold text-sm">Top 12 Nationwide</p>
                    <p className="text-emerald-200 text-xs">Out of 400+ District Winners</p>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">LeftoSense Selected as Top 12 App Nationwide in the U.S. Congressional App Challenge (Out of 400+ District Winners)</h3>
                <p className="text-gray-600 mb-4">
                  LeftoSense was selected as one of the Top 12 apps nationwide in the 2025 Congressional App Challenge, competing against over 400 district-level winners from across the United States.
                </p>
                <a 
                  href="https://www.congressionalappchallenge.us/meet-the-2025-cac-top-apps-winners-presented-by-thecoderschool/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center"
                >
                  View Top Apps Winners
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="mb-4">
                  <div className="w-full h-48 rounded-lg bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center text-6xl">
                    🏅
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">2025 Congressional App Challenge Winner</h3>
                <p className="text-gray-600 mb-4">
                  LeftoSense won first place in the 2025 Congressional App Challenge for California's 19th District, 
                  earning recognition from Rep. Jimmy Panetta and an invitation to the #HouseofCode Event in Washington D.C.
                </p>
                <a 
                  href="https://panetta.house.gov/media/press-releases/rep-panetta-announces-student-winners-2025-congressional-app-challenge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center"
                >
                  Read Press Release
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-center text-gray-600 mb-12">
              Have questions or feedback? We'd love to hear from you!
            </p>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  name: formData.get('name'),
                  email: formData.get('email'),
                  message: formData.get('message')
                };
                
                try {
                  await backendClient.integrations.Core.SendEmail({
                    to: 'saumit.pathak@gmail.com',
                    subject: `LeftoSense Contact Form: ${data.name}`,
                    body: `
                      Name: ${data.name}
                      Email: ${data.email}
                      
                      Message:
                      ${data.message}
                    `
                  });
                  alert('Thanks for reaching out. This demo repository does not include a production email backend, but your message flow is ready to connect.');
                  e.target.reset();
                } catch (error) {
                  alert('Failed to send message. Please try again.');
                }
              }}
              className="bg-white p-8 rounded-xl shadow-lg"
            >
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  required
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Your message..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Send Message
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold">LeftoSense</span>
          </div>
          <p className="text-gray-400">
            © 2026 LeftoSense. Reducing food waste with AI technology.
          </p>
        </div>
      </footer>
    </div>
  );
}