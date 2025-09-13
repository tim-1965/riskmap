// server.js - Labor Rights Risk Assessment API
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for WIX embedding
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/labor_rights');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Enhanced Schemas
const CountrySchema = new mongoose.Schema({
    country: { type: String, required: true, unique: true },
    iso_code: { type: String, required: true, unique: true },
    ituc_rights_rating: { type: Number, required: true },
    corruption_index_ti: { type: Number, required: true },
    migrant_worker_prevalence: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'very_high'],
        required: true 
    },
    education_level: { 
        type: String, 
        enum: ['low', 'medium', 'high'],
        required: true 
    },
    base_risk_score: { type: Number, required: true, min: 1, max: 100 },
    region: { type: String },
    last_updated: { type: Date, default: Date.now }
});

const IndustrySchema = new mongoose.Schema({
    industry: { type: String, required: true, unique: true },
    risk_multiplier: { type: Number, required: true, min: 0.1, max: 3.0 },
    description: { type: String },
    last_updated: { type: Date, default: Date.now }
});

const AssessmentSchema = new mongoose.Schema({
    session_id: { type: String },
    industry: { type: String, required: true },
    countries: [{ type: String, required: true }],
    overall_risk_score: { type: Number, required: true },
    country_scores: [{
        country: String,
        risk_score: Number,
        base_risk_score: Number
    }],
    hrdd_strategies: {
        continuous_monitoring: { type: Number, default: 0 },
        unannounced_audit: { type: Number, default: 0 },
        announced_audit: { type: Number, default: 0 },
        self_assessment: { type: Number, default: 0 },
        no_engagement: { type: Number, default: 0 }
    },
    hrdd_effectiveness: {
        continuous_monitoring: { type: Number, default: 85 },
        unannounced_audit: { type: Number, default: 50 },
        announced_audit: { type: Number, default: 15 },
        self_assessment: { type: Number, default: 5 },
        no_engagement: { type: Number, default: 0 }
    },
    hrdd_multiplier: { type: Number, default: 1.0 },
    created_at: { type: Date, default: Date.now }
});

const Country = mongoose.model('Country', CountrySchema);
const Industry = mongoose.model('Industry', IndustrySchema);
const Assessment = mongoose.model('Assessment', AssessmentSchema);

// Seed data function with complete dataset
const seedDatabase = async () => {
    try {
        const countryCount = await Country.countDocuments();
        const industryCount = await Industry.countDocuments();
        
        if (countryCount === 0) {
            console.log('Seeding countries...');
            const countries = [
                { country: "Denmark", iso_code: "DK", ituc_rights_rating: 1, corruption_index_ti: 90, migrant_worker_prevalence: "low", education_level: "high", base_risk_score: 8, region: "Europe" },
                { country: "Finland", iso_code: "FI", ituc_rights_rating: 2, corruption_index_ti: 87, migrant_worker_prevalence: "low", education_level: "high", base_risk_score: 12, region: "Europe" },
                { country: "Norway", iso_code: "NO", ituc_rights_rating: 1, corruption_index_ti: 84, migrant_worker_prevalence: "low", education_level: "high", base_risk_score: 10, region: "Europe" },
                { country: "Sweden", iso_code: "SE", ituc_rights_rating: 1, corruption_index_ti: 82, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 11, region: "Europe" },
                { country: "Germany", iso_code: "DE", ituc_rights_rating: 2, corruption_index_ti: 78, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 15, region: "Europe" },
                { country: "Netherlands", iso_code: "NL", ituc_rights_rating: 2, corruption_index_ti: 79, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 14, region: "Europe" },
                { country: "United Kingdom", iso_code: "GB", ituc_rights_rating: 2, corruption_index_ti: 71, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 18, region: "Europe" },
                { country: "United States", iso_code: "US", ituc_rights_rating: 3, corruption_index_ti: 69, migrant_worker_prevalence: "high", education_level: "high", base_risk_score: 22, region: "Americas" },
                { country: "Canada", iso_code: "CA", ituc_rights_rating: 2, corruption_index_ti: 76, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 16, region: "Americas" },
                { country: "Australia", iso_code: "AU", ituc_rights_rating: 2, corruption_index_ti: 76, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 16, region: "Asia-Pacific" },
                { country: "France", iso_code: "FR", ituc_rights_rating: 3, corruption_index_ti: 71, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 23, region: "Europe" },
                { country: "Japan", iso_code: "JP", ituc_rights_rating: 2, corruption_index_ti: 73, migrant_worker_prevalence: "low", education_level: "high", base_risk_score: 17, region: "Asia-Pacific" },
                { country: "South Korea", iso_code: "KR", ituc_rights_rating: 3, corruption_index_ti: 63, migrant_worker_prevalence: "medium", education_level: "high", base_risk_score: 25, region: "Asia-Pacific" },
                { country: "Italy", iso_code: "IT", ituc_rights_rating: 2, corruption_index_ti: 56, migrant_worker_prevalence: "medium", education_level: "medium", base_risk_score: 28, region: "Europe" },
                { country: "Spain", iso_code: "ES", ituc_rights_rating: 2, corruption_index_ti: 60, migrant_worker_prevalence: "medium", education_level: "medium", base_risk_score: 26, region: "Europe" },
                { country: "Brazil", iso_code: "BR", ituc_rights_rating: 4, corruption_index_ti: 36, migrant_worker_prevalence: "low", education_level: "medium", base_risk_score: 45, region: "Americas" },
                { country: "Mexico", iso_code: "MX", ituc_rights_rating: 4, corruption_index_ti: 31, migrant_worker_prevalence: "high", education_level: "medium", base_risk_score: 52, region: "Americas" },
                { country: "India", iso_code: "IN", ituc_rights_rating: 4, corruption_index_ti: 39, migrant_worker_prevalence: "medium", education_level: "low", base_risk_score: 58, region: "Asia-Pacific" },
                { country: "China", iso_code: "CN", ituc_rights_rating: 5, corruption_index_ti: 42, migrant_worker_prevalence: "high", education_level: "medium", base_risk_score: 65, region: "Asia-Pacific" },
                { country: "Russia", iso_code: "RU", ituc_rights_rating: 5, corruption_index_ti: 22, migrant_worker_prevalence: "medium", education_level: "medium", base_risk_score: 78, region: "Europe" },
                { country: "Turkey", iso_code: "TR", ituc_rights_rating: 4, corruption_index_ti: 34, migrant_worker_prevalence: "high", education_level: "medium", base_risk_score: 62, region: "MENA" },
                { country: "Bangladesh", iso_code: "BD", ituc_rights_rating: 5, corruption_index_ti: 24, migrant_worker_prevalence: "high", education_level: "low", base_risk_score: 82, region: "Asia-Pacific" },
                { country: "Philippines", iso_code: "PH", ituc_rights_rating: 5, corruption_index_ti: 33, migrant_worker_prevalence: "high", education_level: "medium", base_risk_score: 75, region: "Asia-Pacific" },
                { country: "Myanmar", iso_code: "MM", ituc_rights_rating: 5, corruption_index_ti: 23, migrant_worker_prevalence: "medium", education_level: "low", base_risk_score: 95, region: "Asia-Pacific" },
                { country: "Egypt", iso_code: "EG", ituc_rights_rating: 5, corruption_index_ti: 30, migrant_worker_prevalence: "medium", education_level: "medium", base_risk_score: 78, region: "MENA" },
                { country: "Saudi Arabia", iso_code: "SA", ituc_rights_rating: 5, corruption_index_ti: 42, migrant_worker_prevalence: "very_high", education_level: "medium", base_risk_score: 72, region: "MENA" },
                { country: "Qatar", iso_code: "QA", ituc_rights_rating: 5, corruption_index_ti: 62, migrant_worker_prevalence: "very_high", education_level: "medium", base_risk_score: 68, region: "MENA" },
                { country: "United Arab Emirates", iso_code: "AE", ituc_rights_rating: 4, corruption_index_ti: 67, migrant_worker_prevalence: "very_high", education_level: "medium", base_risk_score: 58, region: "MENA" },
                { country: "Vietnam", iso_code: "VN", ituc_rights_rating: 4, corruption_index_ti: 41, migrant_worker_prevalence: "medium", education_level: "medium", base_risk_score: 55, region: "Asia-Pacific" },
                { country: "Thailand", iso_code: "TH", ituc_rights_rating: 4, corruption_index_ti: 36, migrant_worker_prevalence: "high", education_level: "medium", base_risk_score: 62, region: "Asia-Pacific" },
                { country: "Indonesia", iso_code: "ID", ituc_rights_rating: 4, corruption_index_ti: 34, migrant_worker_prevalence: "medium", education_level: "medium", base_risk_score: 58, region: "Asia-Pacific" },
                { country: "Pakistan", iso_code: "PK", ituc_rights_rating: 4, corruption_index_ti: 29, migrant_worker_prevalence: "medium", education_level: "low", base_risk_score: 72, region: "Asia-Pacific" },
                { country: "Nigeria", iso_code: "NG", ituc_rights_rating: 4, corruption_index_ti: 25, migrant_worker_prevalence: "low", education_level: "low", base_risk_score: 75, region: "Africa" },
                { country: "South Africa", iso_code: "ZA", ituc_rights_rating: 3, corruption_index_ti: 41, migrant_worker_prevalence: "medium", education_level: "medium", base_risk_score: 42, region: "Africa" }
            ];
            await Country.insertMany(countries);
            console.log('Countries seeded successfully');
        }

        if (industryCount === 0) {
            console.log('Seeding industries...');
            const industries = [
                { industry: "agriculture", risk_multiplier: 1.4, description: "High seasonal labor, often migrant workers" },
                { industry: "mining", risk_multiplier: 1.5, description: "Dangerous work, often remote locations" },
                { industry: "manufacturing", risk_multiplier: 1.2, description: "Standard industrial risks" },
                { industry: "textiles", risk_multiplier: 1.6, description: "High risk due to supply chain complexity" },
                { industry: "electronics", risk_multiplier: 1.3, description: "Complex supply chains, precision work" },
                { industry: "automotive", risk_multiplier: 1.1, description: "Generally well-regulated industry" },
                { industry: "construction", risk_multiplier: 1.4, description: "High injury rates, temporary workforce" },
                { industry: "energy", risk_multiplier: 1.3, description: "Infrastructure projects, safety risks" },
                { industry: "healthcare", risk_multiplier: 0.9, description: "Generally well-regulated, skilled workers" },
                { industry: "finance", risk_multiplier: 0.8, description: "Low physical risk, regulated sector" },
                { industry: "retail", risk_multiplier: 1.1, description: "Service sector, varied skill levels" },
                { industry: "hospitality", risk_multiplier: 1.3, description: "Service industry, often migrant workers" },
                { industry: "logistics", risk_multiplier: 1.2, description: "Transportation risks, varied conditions" },
                { industry: "chemicals", risk_multiplier: 1.3, description: "Safety hazards, technical requirements" },
                { industry: "telecommunications", risk_multiplier: 0.9, description: "Technology sector, skilled workforce" }
            ];
            await Industry.insertMany(industries);
            console.log('Industries seeded successfully');
        }

        console.log('Database seeding completed');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all countries
app.get('/api/countries', async (req, res) => {
    try {
        const countries = await Country.find({}, '-_id -__v').sort({ country: 1 });
        res.json(countries);
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all industries
app.get('/api/industries', async (req, res) => {
    try {
        const industries = await Industry.find({}, '-_id -__v').sort({ industry: 1 });
        res.json(industries);
    } catch (error) {
        console.error('Error fetching industries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced calculate risk with HRDD strategies
app.post('/api/calculate-risk', async (req, res) => {
    try {
        const { industry, countries, hrdd_strategies, hrdd_effectiveness } = req.body;

        if (!industry || !countries || !Array.isArray(countries) || countries.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid request. Industry and countries array required.' 
            });
        }

        // Validate HRDD strategies if provided
        let hrddMultiplier = 1.0;
        let hrddData = null;

        if (hrdd_strategies) {
            const totalPercentage = Object.values(hrdd_strategies).reduce((sum, val) => sum + val, 0);
            if (Math.abs(totalPercentage - 100) > 0.1) {
                return res.status(400).json({ 
                    error: 'HRDD strategy percentages must total 100%' 
                });
            }

            // Default effectiveness values (updated to match new requirements)
            const defaultEffectiveness = {
                'continuous_monitoring': 85,
                'unannounced_audit': 50,
                'announced_audit': 15,
                'self_assessment': 5,
                'no_engagement': 0
            };

            // Use custom effectiveness if provided, otherwise use defaults
            const effectiveness = hrdd_effectiveness || defaultEffectiveness;

            let totalEffectiveness = 0;
            Object.entries(hrdd_strategies).forEach(([strategy, percentage]) => {
                const weight = percentage / 100;
                const strategyKey = strategy.replace('-', '_');
                const effValue = (effectiveness[strategyKey] || defaultEffectiveness[strategyKey] || 0) / 100;
                totalEffectiveness += effValue * weight;
            });

            // Convert effectiveness to risk multiplier (0.5 to 1.5 range)
            hrddMultiplier = 1.5 - totalEffectiveness;
            hrddMultiplier = Math.max(0.5, Math.min(1.5, hrddMultiplier));

            hrddData = {
                multiplier: hrddMultiplier,
                effectiveness: totalEffectiveness,
                strategies: hrdd_strategies,
                effectiveness_values: effectiveness
            };
        }

        // Get industry multiplier
        const industryData = await Industry.findOne({ industry });
        if (!industryData) {
            return res.status(400).json({ error: 'Invalid industry' });
        }

        // Get country data
        const countryData = await Country.find({ country: { $in: countries } });
        if (countryData.length !== countries.length) {
            const foundCountries = countryData.map(c => c.country);
            const missingCountries = countries.filter(c => !foundCountries.includes(c));
            return res.status(400).json({ 
                error: 'Invalid countries', 
                missing: missingCountries 
            });
        }

        // Calculate risk scores with HRDD impact
        const countryRisks = countryData.map(country => {
            const baseRisk = country.base_risk_score;
            let adjustedRisk = baseRisk * industryData.risk_multiplier * hrddMultiplier;
            adjustedRisk = Math.min(100, Math.round(adjustedRisk));
            return {
                country: country.country,
                risk: adjustedRisk,
                base_risk: baseRisk
            };
        });

        const overallRisk = Math.round(
            countryRisks.reduce((sum, item) => sum + item.risk, 0) / countryRisks.length
        );

        // Save enhanced assessment
        const assessment = new Assessment({
            industry,
            countries,
            overall_risk_score: overallRisk,
            country_scores: countryRisks.map(cr => ({
                country: cr.country,
                risk_score: cr.risk,
                base_risk_score: cr.base_risk
            })),
            hrdd_strategies: hrdd_strategies || {},
            hrdd_effectiveness: hrdd_effectiveness || {},
            hrdd_multiplier: hrddMultiplier
        });
        await assessment.save();

        const response = {
            overall_risk: overallRisk,
            country_risks: countryRisks,
            industry_multiplier: industryData.risk_multiplier,
            assessment_id: assessment._id
        };

        if (hrddData) {
            response.hrdd_data = hrddData;
        }

        res.json(response);

    } catch (error) {
        console.error('Error calculating risk:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const startServer = async () => {
    await connectDB();
    await seedDatabase();
    
    app.listen(PORT, () => {
        console.log(`Labor Rights Risk API running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`API base URL: http://localhost:${PORT}/api`);
    });
};

startServer().catch(console.error);

module.exports = app;