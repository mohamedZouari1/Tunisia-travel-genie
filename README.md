Tunisia Travel Genie 🗺️🇹🇳
A smart, interactive travel planning application that creates personalized itineraries for Tunisia using real geographic data and intelligent algorithms.

https://img.shields.io/badge/Tunisia-Travel%2520Planning-blue
https://img.shields.io/badge/React-18.2.0-61dafb
https://img.shields.io/badge/Leaflet-Maps-199900
https://img.shields.io/badge/Data-OpenStreetMap-orange

✨ Features
🎯 Smart Itinerary Generation
Multi-day trip planning (2, 3, 5, or 7 days)

Personalized recommendations based on travel style (Couple, Family, Solo, Friends)

Automatic activity scheduling with intelligent time management

Proximity-based POI selection within 20km of selected hotel

🗺️ Interactive Maps & Navigation
Leaflet-powered interactive maps with custom markers

Real-time itinerary visualization with daily routes

Color-coded POI categories: 🏨 Hotels, 🍴 Restaurants, ☕ Cafes, 🏛️ Museums, 🎯 Attractions

Automatic zoom and bounds to show daily activities

🏨 Intelligent Hotel System
Advanced search and filter by city and hotel name

Special region detection for authentic cultural experiences

Smart pagination handling large datasets efficiently

Hotel image integration with graceful fallbacks

🌍 Special Region Experiences
Authentic cultural itineraries for Zaghouan, Beja, and Jendouba

Local expert integration and partnership connections

Cultural activity recommendations beyond typical tourism

Multi-language support (English & Arabic)

🛠️ Tech Stack
Frontend: React 18.2.0, CSS3, JavaScript (ES6+)

Maps: Leaflet, React-Leaflet

Data: GeoJSON, OpenStreetMap datasets

Styling: Custom CSS with gradient designs

Tools: QGIS for data processing

📊 Data Pipeline
Data Sources & Processing
Source: HDX Tunisia POI dataset from OpenStreetMap

Processing: QGIS filtering and data cleaning

Categorization:

tourism=hotel → Hotels dataset

amenity=restaurant → Restaurants dataset

amenity=cafe → Cafes dataset

tourism=museum → Museums dataset

tourism=attraction → Attractions dataset

Export: Separate GeoJSON files for each category

Geographic Intelligence
Haversine distance calculations for proximity-based recommendations

Smart clustering of nearby points of interest

Route optimization for logical activity sequencing

Regional specialization for unique cultural experiences

🚀 Quick Start
Prerequisites
Node.js 14+

npm or yarn

Installation
bash
# Clone the repository
git clone https://github.com/mohamedZouari1/Tunisia-travel-genie.git

# Navigate to project directory
cd Tunisia-travel-genie

# Install dependencies
npm install

# Start development server
npm start
The application will open at http://localhost:3000

📁 Project Structure
text
tunisia-travel-genie/
├── public/
│   ├── data/                   # GeoJSON datasets
│   │   ├── hotels.geojson
│   │   ├── restaurants.geojson
│   │   ├── cafes.geojson
│   │   ├── museums.geojson
│   │   └── attractions.geojson
│   └── index.html
├── src/
│   ├── components/             # React components
│   ├── styles/                 # CSS files
│   ├── utils/                  # Helper functions
│   ├── App.js                  # Main application
│   └── index.js
├── package.json
└── README.md
🎨 Key Components
Planning Wizard
Step 1: Travel preferences and duration selection

Step 2: Interactive hotel selection with maps

Step 3: Personalized daily itinerary generation

Step 4: Special region cultural experiences

Smart Features
Automatic activity categorization: Beaches, Parks, Historical sites, Viewpoints

Time-based scheduling: Morning, afternoon, evening activities

Transportation estimates: Walking vs taxi time calculations

Print functionality: Export complete itineraries

🌟 Unique Features
Intelligent Algorithm
javascript
// Smart itinerary generation includes:
- Morning cultural activities (museums, historical sites)
- Lunch at nearby restaurants with local cuisine
- Afternoon relaxation (beaches, parks, cafes)
- Romantic viewpoints for couples
- Family-friendly activities for families
- Evening dining experiences
Special Region Handling
Automatic detection of Zaghouan, Beja, and Jendouba hotels

Alternative content showcasing authentic cultural experiences

Local expert connections for personalized guidance

Multi-language city name recognition (English & Arabic)

📈 Performance Features
Efficient data loading with asynchronous GeoJSON parsing

Smart pagination for large hotel datasets

Lazy loading of images and map components

Responsive design for all device sizes

🔧 Customization
Adding New Regions
Update the getHotelZone function in App.js to detect new special regions.

Modifying POI Categories
Edit the categorization logic in the categorizeAttractions function.

Styling Changes
Modify App.css for custom colors, layouts, and animations.

🤝 Contributing
We welcome contributions! Please feel free to submit pull requests or open issues for:

New features and enhancements

Bug fixes and performance improvements

Documentation updates

Additional regional data

Development Workflow
Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
OpenStreetMap contributors for comprehensive geographic data

HDX (Humanitarian Data Exchange) for Tunisia datasets

Leaflet community for robust mapping solutions

React team for the excellent framework

QGIS for powerful geographic data processing tools

📞 Support
If you have any questions or need help with the application, please open an issue on GitHub.

Experience Tunisia like never before with AI-powered travel planning! ✨

Built with ❤️ for Tunisia explorers and adventure seekers
