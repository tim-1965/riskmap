// server.js - Enhanced Labor Rights Risk Assessment API with Activity Volume Weighting
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

// Enhanced Schemas with Activity Volume Support
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

const IndexSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    values: { type: Map, of: Number },
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
        base_risk_score: Number,
        activity_level: Number,
        weight: Number
    }],
    hrdd_strategies: { type: Map, of: Number },
    hrdd_effectiveness: { type: Map, of: Number },
    hrdd_multiplier: { type: Number, default: 1.0 },
    activity_data: { type: Map, of: Number },
    total_activity: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

const Country = mongoose.model('Country', CountrySchema);
const Industry = mongoose.model('Industry', IndustrySchema);
const Index = mongoose.model('Index', IndexSchema);
const Assessment = mongoose.model('Assessment', AssessmentSchema);

// Seed data function with complete dataset

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

// Enhanced calculate risk with HRDD strategies and activity volume weighting
app.post('/api/calculate-risk', async (req, res) => {
    try {
        const { industry, countries, activity_volumes, hrdd_strategies, hrdd_effectiveness } = req.body;

        if (!industry || !countries || !Array.isArray(countries) || countries.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid request. Industry and countries array required.' 
            });
        }

        // Fetch default activity level from database
        const activityIndex = await Index.findOne({ name: 'activity_level' });
        const defaultActivity = activityIndex ? activityIndex.values.get('default') : 10;

        // Validate and process activity volumes
        let activityData = {};
        if (activity_volumes && typeof activity_volumes === 'object') {
            // Ensure all countries have activity volumes and they're valid numbers
            countries.forEach(country => {
                activityData[country] = Math.max(1, Number(activity_volumes[country]) || defaultActivity);
            });
        } else {
            // Default all countries to activity level from database
            countries.forEach(country => {
                activityData[country] = defaultActivity;
            });
        }

        // Calculate total activity for weighting
        const totalActivity = Object.values(activityData).reduce((sum, vol) => sum + vol, 0);

        // Validate HRDD strategies if provided
        let hrddMultiplier = 1.0;
        let hrddData = null;
        let usedEffectiveness = null;

        if (hrdd_strategies) {
            const totalPercentage = Object.values(hrdd_strategies).reduce((sum, val) => sum + val, 0);
            if (Math.abs(totalPercentage - 100) > 0.1) {
                return res.status(400).json({ 
                    error: 'HRDD strategy percentages must total 100%' 
                });
            }

            // Use default effectiveness from database if custom values not provided
            const hrddIndex = await Index.findOne({ name: 'hrdd_effectiveness' });
            const defaultEffectiveness = hrddIndex ? Object.fromEntries(hrddIndex.values) : {};
            const effectiveness = hrdd_effectiveness || defaultEffectiveness;
            usedEffectiveness = effectiveness;

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

        // Calculate risk scores with HRDD impact and activity weighting
        const countryRisks = countryData.map(country => {
            const baseRisk = country.base_risk_score;
            const activityLevel = activityData[country.country];
            const weight = (activityLevel / totalActivity) * 100;
            
            let adjustedRisk = baseRisk * industryData.risk_multiplier * hrddMultiplier;
            adjustedRisk = Math.min(100, Math.round(adjustedRisk));
            
            return {
                country: country.country,
                risk: adjustedRisk,
                base_risk: baseRisk,
                activity_level: activityLevel,
                weight: weight
            };
        });

        // Calculate weighted overall risk based on activity levels
        const overallRisk = Math.round(
            countryRisks.reduce((sum, item) => sum + (item.risk * item.weight / 100), 0)
        );

        // Save enhanced assessment with activity data
        const assessment = new Assessment({
            industry,
            countries,
            overall_risk_score: overallRisk,
            country_scores: countryRisks.map(cr => ({
                country: cr.country,
                risk_score: cr.risk,
                base_risk_score: cr.base_risk,
                activity_level: cr.activity_level,
                weight: cr.weight
            })),
            hrdd_strategies: hrdd_strategies || {},
            hrdd_effectiveness: usedEffectiveness || {},
            hrdd_multiplier: hrddMultiplier,
            activity_data: activityData,
            total_activity: totalActivity
        });
        await assessment.save();

        const response = {
            overall_risk: overallRisk,
            country_risks: countryRisks,
            industry_multiplier: industryData.risk_multiplier,
            assessment_id: assessment._id,
            total_activity: totalActivity
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

// Get assessment by ID
app.get('/api/assessment/:id', async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        res.json(assessment);
    } catch (error) {
        console.error('Error fetching assessment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent assessments (optional - for analytics)
app.get('/api/assessments/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const assessments = await Assessment.find({})
            .sort({ created_at: -1 })
            .limit(limit)
            .select('-activity_data'); // Exclude large activity data for list view
        res.json(assessments);
    } catch (error) {
        console.error('Error fetching recent assessments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get country details by name or ISO code
app.get('/api/country/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const country = await Country.findOne({
            $or: [
                { country: { $regex: new RegExp(identifier, 'i') } },
                { iso_code: identifier.toUpperCase() }
            ]
        });
        
        if (!country) {
            return res.status(404).json({ error: 'Country not found' });
        }
        
        res.json(country);
    } catch (error) {
        console.error('Error fetching country:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get industry details
app.get('/api/industry/:name', async (req, res) => {
    try {
        const industry = await Industry.findOne({ 
            industry: { $regex: new RegExp(req.params.name, 'i') } 
        });
        
        if (!industry) {
            return res.status(404).json({ error: 'Industry not found' });
        }
        
        res.json(industry);
    } catch (error) {
        console.error('Error fetching industry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Enhanced Labor Rights Risk API running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`API base URL: http://localhost:${PORT}/api`);
        console.log('Features: Activity Volume Weighting, HRDD Strategies, Enhanced Analytics');
    });
};

startServer().catch(console.error);

module.exports = app;