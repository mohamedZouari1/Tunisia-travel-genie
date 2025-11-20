import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different POI types
const createCustomIcon = (color, emoji) => {
    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${emoji}</div>`,
        className: 'custom-div-icon',
        iconSize: [35, 35],
        iconAnchor: [17, 17],
    });
};

const icons = {
    hotel: createCustomIcon('#FFD700', '🏨'),
    museum: createCustomIcon('#3498db', '🏛️'),
    attraction: createCustomIcon('#9b59b6', '🎯'),
    restaurant: createCustomIcon('#2ecc71', '🍴'),
    cafe: createCustomIcon('#e67e22', '☕'),
    beach: createCustomIcon('#1abc9c', '🏖️'),
    park: createCustomIcon('#27ae60', '🌳'),
    shopping: createCustomIcon('#e74c3c', '🛍️'),
    historical: createCustomIcon('#8e44ad', '🏺'),
};

// Hotel image database
const hotelImages = {
    'movenpick': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
    'hilton': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop',
    'sheraton': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=250&fit=crop',
    'laico': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop',
    'diar': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=250&fit=crop',
    'elmouradi': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop',
    'radisson': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=250&fit=crop',
    'default1': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
    'default2': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop',
    'default3': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=250&fit=crop',
};

const getHotelImage = (hotelName) => {
    if (!hotelName) return hotelImages.default1;

    const nameLower = hotelName.toLowerCase();
    if (nameLower.includes('movenpick')) return hotelImages.movenpick;
    if (nameLower.includes('hilton')) return hotelImages.hilton;
    if (nameLower.includes('sheraton')) return hotelImages.sheraton;
    if (nameLower.includes('laico')) return hotelImages.laico;
    if (nameLower.includes('diar')) return hotelImages.diar;
    if (nameLower.includes('elmouradi')) return hotelImages.elmouradi;
    if (nameLower.includes('radisson')) return hotelImages.radisson;

    const defaultImages = [hotelImages.default1, hotelImages.default2, hotelImages.default3];
    let hash = 0;
    for (let i = 0; i < hotelName.length; i++) {
        hash = hotelName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return defaultImages[Math.abs(hash) % defaultImages.length];
};

function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => m.coords));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, map]);
    return null;
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const loadGeoJSON = async(fileName) => {
    try {
        const response = await fetch(`/data/${fileName}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${fileName}:`, error);
        return { features: [] };
    }
};

function App() {
    const [step, setStep] = useState(1);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [tripType, setTripType] = useState('couple');
    const [days, setDays] = useState(3);
    const [loading, setLoading] = useState(true);
    const [availableHotels, setAvailableHotels] = useState([]);
    const [availableMuseums, setAvailableMuseums] = useState([]);
    const [availableAttractions, setAvailableAttractions] = useState([]);
    const [availableRestaurants, setAvailableRestaurants] = useState([]);
    const [availableCafes, setAvailableCafes] = useState([]);
    const [nearbyPOIs, setNearbyPOIs] = useState({ museums: [], attractions: [], restaurants: [], cafes: [] });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [imageLoadErrors, setImageLoadErrors] = useState({});
    const [visibleHotelsCount, setVisibleHotelsCount] = useState(10);
    const [currentDay, setCurrentDay] = useState(1);

    useEffect(() => {
        const loadAllData = async() => {
            setLoading(true);
            try {
                const [hotels, museums, attractions, restaurants, cafes] = await Promise.all([
                    loadGeoJSON('hotels.geojson'),
                    loadGeoJSON('museums.geojson'),
                    loadGeoJSON('attractions.geojson'),
                    loadGeoJSON('restaurants.geojson'),
                    loadGeoJSON('cafes.geojson')
                ]);
                setAvailableHotels(hotels.features || []);
                setAvailableMuseums(museums.features || []);
                setAvailableAttractions(attractions.features || []);
                setAvailableRestaurants(restaurants.features || []);
                setAvailableCafes(cafes.features || []);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    const cities = ['all', ...new Set(availableHotels
        .map(hotel => (hotel.properties && hotel.properties['addr:city']) || (hotel.properties && hotel.properties.city) || 'Other')
        .filter(city => city && city !== 'Other')
    )];

    const filteredHotels = availableHotels
        .filter(hotel => {
            const name = hotel.properties && hotel.properties.name;
            const city = hotel.properties && hotel.properties['addr:city'];

            const matchesSearch = (name && name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (city && city.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCity = selectedCity === 'all' || city === selectedCity;

            return matchesSearch && matchesCity;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return ((a.properties && a.properties.name) || '').localeCompare((b.properties && b.properties.name) || '');
                case 'city':
                    return ((a.properties && a.properties['addr:city']) || '').localeCompare((b.properties && b.properties['addr:city']) || '');
                default:
                    return 0;
            }
        });

    const visibleHotels = filteredHotels.slice(0, visibleHotelsCount);
    const hasMoreHotels = visibleHotels.length < filteredHotels.length;

    const loadMoreHotels = () => {
        setVisibleHotelsCount(prev => prev + 10);
    };

    useEffect(() => {
        if (selectedHotel) {
            const hotelCoords = selectedHotel.geometry.coordinates;
            const hotelLat = hotelCoords[1];
            const hotelLon = hotelCoords[0];

            const findNearby = (pois, maxDistance = 20) =>
                pois.filter(poi => {
                    const poiCoords = poi.geometry.coordinates;
                    const distance = calculateDistance(hotelLat, hotelLon, poiCoords[1], poiCoords[0]);
                    return distance <= maxDistance;
                });

            setNearbyPOIs({
                museums: findNearby(availableMuseums),
                attractions: findNearby(availableAttractions),
                restaurants: findNearby(availableRestaurants, 5),
                cafes: findNearby(availableCafes, 3)
            });
        }
    }, [selectedHotel, availableMuseums, availableAttractions, availableRestaurants, availableCafes]);

    const handleImageError = (hotelName) => {
        setImageLoadErrors(prev => ({...prev, [hotelName]: true }));
    };

    // Enhanced POI categorization
    const categorizeAttractions = (attractions) => {
        return {
            beaches: attractions.filter(attr =>
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('beach')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('plage'))
            ),
            parks: attractions.filter(attr =>
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('park')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('garden')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('jardin'))
            ),
            historical: attractions.filter(attr =>
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('ruin')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('ancient')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('historical')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('monument'))
            ),
            viewpoints: attractions.filter(attr =>
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('view')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('panoramic')) ||
                (attr.properties && attr.properties.name && attr.properties.name.toLowerCase().includes('sunset'))
            ),
            other: attractions.filter(attr => {
                const name = (attr.properties && attr.properties.name) || '';
                const lowerName = name.toLowerCase();
                return !lowerName.includes('beach') &&
                    !lowerName.includes('park') &&
                    !lowerName.includes('garden') &&
                    !lowerName.includes('ruin') &&
                    !lowerName.includes('ancient') &&
                    !lowerName.includes('historical') &&
                    !lowerName.includes('view') &&
                    !lowerName.includes('panoramic');
            })
        };
    };

    // Generate daily itineraries
    const generateDailyItineraries = () => {
        if (!selectedHotel) return [];

        const categorizedAttractions = categorizeAttractions(nearbyPOIs.attractions);
        const dailyPlans = [];

        for (let day = 1; day <= days; day++) {
            const dayPlan = {
                day: day,
                activities: []
            };

            // Morning activities
            if (day === 1) {
                // First day - lighter schedule
                dayPlan.activities.push({
                    time: '08:00',
                    activity: 'Wake up & Hotel Breakfast',
                    type: 'hotel',
                    description: 'Start your day with a delicious breakfast at your hotel'
                });

                // Add a cultural activity
                if (nearbyPOIs.museums.length > 0) {
                    dayPlan.activities.push({
                        time: '10:00',
                        activity: `Visit ${nearbyPOIs.museums[0].properties?.name}`,
                        type: 'museum',
                        poi: nearbyPOIs.museums[0],
                        description: 'Explore local culture and history',
                        transport: '15min taxi ride'
                    });
                }
            } else if (day === days) {
                // Last day - relaxed schedule
                dayPlan.activities.push({
                    time: '09:00',
                    activity: 'Leisurely Breakfast',
                    type: 'hotel',
                    description: 'Enjoy a relaxed morning'
                });

                // Beach or park on last day
                if (categorizedAttractions.beaches.length > 0) {
                    dayPlan.activities.push({
                        time: '11:00',
                        activity: `Relax at ${categorizedAttractions.beaches[0].properties?.name}`,
                        type: 'beach',
                        poi: categorizedAttractions.beaches[0],
                        description: 'Enjoy the sun and sea',
                        transport: '10min taxi ride'
                    });
                }
            } else {
                // Middle days - full exploration
                dayPlan.activities.push({
                    time: '07:30',
                    activity: 'Early Breakfast',
                    type: 'hotel',
                    description: 'Fuel up for a day of exploration'
                });

                // Morning attraction
                const morningAttraction = categorizedAttractions.historical[0] ||
                    categorizedAttractions.parks[0] ||
                    categorizedAttractions.other[day % categorizedAttractions.other.length];
                if (morningAttraction) {
                    dayPlan.activities.push({
                        time: '09:00',
                        activity: `Explore ${morningAttraction.properties?.name}`,
                        type: getPoiType(morningAttraction),
                        poi: morningAttraction,
                        description: 'Discover local attractions',
                        transport: '20min taxi ride'
                    });
                }
            }

            // Lunch
            if (nearbyPOIs.restaurants.length > 0) {
                dayPlan.activities.push({
                    time: '13:00',
                    activity: `Lunch at ${nearbyPOIs.restaurants[day % nearbyPOIs.restaurants.length].properties?.name}`,
                    type: 'restaurant',
                    poi: nearbyPOIs.restaurants[day % nearbyPOIs.restaurants.length],
                    description: 'Taste local cuisine',
                    transport: '10min walk'
                });
            }

            // Afternoon activities
            if (day !== days) {
                // Afternoon attraction
                const afternoonAttraction = categorizedAttractions.beaches[0] ||
                    categorizedAttractions.viewpoints[0] ||
                    categorizedAttractions.other[(day + 1) % categorizedAttractions.other.length];
                if (afternoonAttraction) {
                    dayPlan.activities.push({
                        time: '15:00',
                        activity: `Visit ${afternoonAttraction.properties?.name}`,
                        type: getPoiType(afternoonAttraction),
                        poi: afternoonAttraction,
                        description: 'Continue your exploration',
                        transport: '15min taxi ride'
                    });
                }

                // Coffee break
                if (nearbyPOIs.cafes.length > 0) {
                    dayPlan.activities.push({
                        time: '17:00',
                        activity: `Coffee break at ${nearbyPOIs.cafes[day % nearbyPOIs.cafes.length].properties?.name}`,
                        type: 'cafe',
                        poi: nearbyPOIs.cafes[day % nearbyPOIs.cafes.length],
                        description: 'Relax with local coffee or tea',
                        transport: '5min walk'
                    });
                }
            }

            // Dinner
            if (nearbyPOIs.restaurants.length > 1) {
                const dinnerRestaurant = nearbyPOIs.restaurants[(day + 1) % nearbyPOIs.restaurants.length];
                dayPlan.activities.push({
                    time: '19:30',
                    activity: `Dinner at ${dinnerRestaurant.properties?.name}`,
                    type: 'restaurant',
                    poi: dinnerRestaurant,
                    description: 'Evening dining experience',
                    transport: '10min taxi ride'
                });
            }

            // Evening activity for couples
            if (tripType === 'couple' && categorizedAttractions.viewpoints.length > 0) {
                dayPlan.activities.push({
                    time: '21:00',
                    activity: `Sunset at ${categorizedAttractions.viewpoints[0].properties?.name}`,
                    type: 'attraction',
                    poi: categorizedAttractions.viewpoints[0],
                    description: 'Romantic evening views',
                    transport: '15min taxi ride'
                });
            }

            dailyPlans.push(dayPlan);
        }

        return dailyPlans;
    };

    const getPoiType = (poi) => {
        const name = (poi.properties && poi.properties.name && poi.properties.name.toLowerCase()) || '';
        if (name.includes('beach') || name.includes('plage')) return 'beach';
        if (name.includes('park') || name.includes('garden') || name.includes('jardin')) return 'park';
        if (name.includes('museum')) return 'museum';
        if (name.includes('restaurant') || name.includes('cafe') || name.includes('coffee')) return 'restaurant';
        if (name.includes('shopping') || name.includes('market') || name.includes('mall')) return 'shopping';
        if (name.includes('ruin') || name.includes('ancient') || name.includes('historical')) return 'historical';
        return 'attraction';
    };
    // ========== ADD THESE 3 NEW FUNCTIONS HERE ==========
    // ========== UPDATED FUNCTIONS WITH ZAGHOUAN INSTEAD OF KEF ==========
    const isSpecialRegion = (hotel) => {
        const city = (hotel.properties && hotel.properties['addr:city']) || '';
        const name = (hotel.properties && hotel.properties.name) || '';
        const cityLower = city.toLowerCase();
        const nameLower = name.toLowerCase();

        const specialRegions = ['zaghouan', 'beja', 'jendouba', 'زغوان', 'باجة', 'جندوبة'];

        return specialRegions.some(region =>
            cityLower.includes(region) || nameLower.includes(region)
        );
    };

    const getHotelZone = (hotel) => {
        const city = (hotel.properties && hotel.properties['addr:city']) || '';
        const name = (hotel.properties && hotel.properties.name) || '';
        const cityLower = city.toLowerCase();
        const nameLower = name.toLowerCase();

        // Zaghouan region - both languages
        if (cityLower.includes('zaghouan') || cityLower.includes('زغوان') ||
            nameLower.includes('zaghouan') || nameLower.includes('زغوان')) {
            return 'zaghouan';
        }

        // Beja region - both languages
        if (cityLower.includes('beja') || cityLower.includes('béja') || cityLower.includes('باجة') ||
            nameLower.includes('beja') || nameLower.includes('béja') || nameLower.includes('باجة')) {
            return 'beja';
        }

        // Jendouba region - both languages
        if (cityLower.includes('jendouba') || cityLower.includes('جندوبة') ||
            nameLower.includes('jendouba') || nameLower.includes('جندوبة')) {
            return 'jendouba';
        }

        return null;
    };

    const getSpecialRegionContent = (hotel) => {
        const zone = getHotelZone(hotel);

        const regionData = {
            zaghouan: {
                title: "⛰️💧 Zaghouan Region (زغوان)",
                description: "Discover the beautiful mountains, waterfalls, and Roman aqueducts of Zaghouan",
                activities: [
                    "Visit the Temple of Waters",
                    "Explore Roman aqueduct ruins",
                    "Hiking in Jebel Zaghouan",
                    "Visit traditional pottery workshops",
                    "Enjoy local mountain cuisine"
                ],
                link: "https://zaghouan-region-experts.com"
            },
            beja: {
                title: "🌾🏺 Beja Region (باجة)",
                description: "Agricultural heartland with rich history and traditional villages",
                activities: [
                    "Visit Dougga Roman ruins",
                    "Explore traditional olive farms",
                    "Local wine tasting",
                    "Mountain viewpoints",
                    "Cultural heritage sites"
                ],
                link: "https://beja-region-experts.com"
            },
            jendouba: {
                title: "🌳🏛️ Jendouba Region (جندوبة)",
                description: "Gateway to the northwest with diverse landscapes and archaeological sites",
                activities: [
                    "Visit Bulla Regia underground city",
                    "Explore Ain Draham forests",
                    "Traditional cooking classes",
                    "Local market experiences",
                    "Nature walks and bird watching"
                ],
                link: "https://jendouba-region-experts.com"
            }
        };

        return regionData[zone];
    };
    // ========== END OF UPDATED FUNCTIONS ==========
    // ========== END OF NEW FUNCTIONS ==========

    const getCurrentDayActivities = () => {
        const itineraries = generateDailyItineraries();
        return (itineraries.find(itinerary => itinerary.day === currentDay) || {}).activities || [];
    };

    const getCurrentDayMapMarkers = () => {
        const activities = getCurrentDayActivities();
        const markers = [
            { coords: [selectedHotel.geometry.coordinates[1], selectedHotel.geometry.coordinates[0]], type: 'hotel', data: selectedHotel }
        ];

        activities.forEach(activity => {
            if (activity.poi) {
                markers.push({
                    coords: [activity.poi.geometry.coordinates[1], activity.poi.geometry.coordinates[0]],
                    type: activity.type,
                    data: activity.poi
                });
            }
        });

        return markers;
    };

    // Print functionality


    const printAllDays = () => {
            const dailyItineraries = generateDailyItineraries();
            const printWindow = window.open('', '_blank');

            printWindow.document.write(`
      <html>
        <head>
          <title>Tunisia Itinerary - ${days} Days</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .hotel-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .day-section { margin-bottom: 40px; break-inside: avoid; }
            .day-header { background: #667eea; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .activity { margin: 15px 0; padding: 12px; border-left: 4px solid #667eea; background: #f8f9fa; }
            .time { font-weight: bold; color: #2c3e50; font-size: 16px; }
            .transport { color: #667eea; font-size: 14px; margin-top: 5px; }
            @media print {
              body { margin: 0; }
              .day-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🇹🇳 Tunisia Travel Itinerary</h1>
            <h2>${days}-Day Complete Schedule</h2>
          </div>
          
          <div class="hotel-info">
            <p><strong>Hotel:</strong> ${selectedHotel.properties?.name}</p>
            <p><strong>Travel Style:</strong> ${tripType}</p>
            <p><strong>Duration:</strong> ${days} days</p>
          </div>
          
          ${dailyItineraries.map(day => `
            <div class="day-section">
              <div class="day-header">
                <h2>Day ${day.day} Schedule</h2>
              </div>
              ${day.activities.map(activity => `
                <div class="activity">
                  <div class="time">${activity.time}</div>
                  <div><strong>${activity.activity}</strong></div>
                  <div>${activity.description}</div>
                  ${activity.transport ? `<div class="transport">${activity.transport.includes('walk') ? '🚶‍♂️' : '🚕'} ${activity.transport}</div>` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const renderStep1 = () => (
    <div className="step-container">
      <div className="step-header">
        <h2>🌴 Plan Your Tunisia Adventure</h2>
        <p>Tell us about your trip and we'll create the perfect itinerary</p>
      </div>

      <div className="form-section">
        <div className="input-group">
          <label>👥 Travel Style</label>
          <div className="option-grid">
            {[
              { type: 'couple', icon: '👩‍❤️‍👨', label: 'Couple' },
              { type: 'family', icon: '👨‍👩‍👧‍👦', label: 'Family' },
              { type: 'solo', icon: '👤', label: 'Solo' },
              { type: 'friends', icon: '👥', label: 'Friends' }
            ].map(({ type, icon, label }) => (
              <div key={type} className={`option-card ${tripType === type ? 'selected' : ''}`} onClick={() => setTripType(type)}>
                <div className="option-icon">{icon}</div>
                <span className="option-text">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>📅 Trip Duration</label>
          <div className="days-selector">
            {[2, 3, 5, 7].map(day => (
              <button key={day} className={`day-btn ${days === day ? 'active' : ''}`} onClick={() => setDays(day)}>
                {day} {day === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="cta-button" onClick={() => setStep(2)} disabled={loading}>
        {loading ? 'Loading Tunisia Data...' : 'Find Perfect Hotel →'}
      </button>
    </div>
  );

  const renderHotelCard = (hotel, index) => {
    const isSelected = selectedHotel?.properties?.name === hotel.properties?.name;
    const city = hotel.properties?.['addr:city'] || 'Tunisia';
    const hotelName = hotel.properties?.name || 'Luxury Tunisian Hotel';
    const hotelImage = getHotelImage(hotelName);
    const imageFailed = imageLoadErrors[hotelName];
    
    return (
      <div key={index} className={`hotel-card ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedHotel(hotel)}>
        <div className="hotel-image">
          {!imageFailed ? (
            <img src={hotelImage} alt={hotelName} className="hotel-real-image" onError={() => handleImageError(hotelName)} />
          ) : (
            <div className="hotel-placeholder">🏨</div>
          )}
          <div className="hotel-badge">
            {tripType === 'couple' && '👩‍❤️‍👨 Romantic'}
            {tripType === 'family' && '👨‍👩‍👧‍👦 Family'}
            {tripType === 'solo' && '👤 Solo'}
            {tripType === 'friends' && '👥 Friends'}
          </div>
        </div>
        <div className="hotel-info">
          <h3>{hotelName}</h3>
          <p className="hotel-location">📍 {city}</p>
          <div className="hotel-features">
            <span className="feature-tag">⭐ 4.2+</span>
            <span className="feature-tag">🏊 Pool</span>
            <span className="feature-tag">🍽️ Restaurant</span>
          </div>
          <div className="hotel-actions">
            <button className={`select-btn ${isSelected ? 'selected' : ''}`}>
              {isSelected ? '✓ Selected' : 'Select Hotel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="step-container">
      <div className="step-header">
        <h2>🏨 Find Your Perfect Stay in Tunisia</h2>
        <p>Choose from {availableHotels.length} hotels across Tunisia</p>
      </div>

      {/* Search and Filter Section */}
      <div className="hotel-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search hotels by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Filter by City:</label>
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className="filter-select"
            >
              {cities.map(city => (
                <option key={city} value={city}>
                  {city === 'all' ? '🏙️ All Cities' : `📍 ${city}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">📝 Name</option>
              <option value="city">🏙️ City</option>
            </select>
          </div>
        </div>
        
        <div className="results-info">
          <p>
            Showing {visibleHotels.length} of {filteredHotels.length} hotels
            {selectedCity !== 'all' && ` in ${selectedCity}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      </div>

      {availableHotels.length === 0 ? (
        <div className="no-hotels">
          <h3>🚨 No Hotels Found in Database</h3>
          <p>Please check your GeoJSON files in the public/data/ folder.</p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="no-results">
          <h3>🔍 No hotels match your search</h3>
          <p>Try changing your search terms or city filter.</p>
        </div>
      ) : (
        <>
          <div className="hotels-grid">
            {visibleHotels.map((hotel, index) => renderHotelCard(hotel, index))}
          </div>

          {/* Show More Button */}
          {hasMoreHotels && (
            <div className="load-more-section">
              <button className="load-more-btn" onClick={loadMoreHotels}>
                📍 Show More Hotels ({filteredHotels.length - visibleHotels.length} remaining)
              </button>
            </div>
          )}
        </>
      )}

{selectedHotel && (
  <div className="selection-confirm">
    <div className="selected-hotel-info">
      <h3>✅ Perfect Choice! "{(selectedHotel.properties && selectedHotel.properties.name) || 'Hotel'}" Selected</h3>
      
      {isSpecialRegion(selectedHotel) ? (
        <div className="special-region-notice">
          <p>🎯 <strong>Special Region Detected!</strong></p>
          <p>You've selected one of Tunisia's authentic hidden regions. These areas offer unique cultural experiences rather than typical tourist itineraries.</p>
          <button 
            className="special-region-btn"
            onClick={() => setStep(4)}
          >
            🗺️ Explore Authentic Experiences →
          </button>
        </div>
      ) : (
        <p>
          Excellent selection for your {tripType} adventure! 
          Ready to explore nearby attractions.
        </p>
      )}
    </div>
  </div>
)}

      <div className="step-actions">
        <button className="back-button" onClick={() => setStep(1)}>
          ← Back to Trip Details
        </button>
        <button 
          className="cta-button"
          onClick={() => setStep(3)}
          disabled={!selectedHotel}
        >
          🗺️ See My Personalized Itinerary →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const dailyItineraries = generateDailyItineraries();
    const currentDayActivities = getCurrentDayActivities();
    const currentDayMarkers = getCurrentDayMapMarkers();

    return (
      <div className="itinerary-container">
        <div className="step-header">
          <h2>✨ Your {days}-Day Tunisia Itinerary</h2>
          <p>Perfect for {tripType} travel • Based at {selectedHotel.properties?.name}</p>
        </div>

        {/* Day Navigation */}
        <div className="day-navigation">
          <h3>📅 Select Day</h3>
          <div className="day-buttons">
            {dailyItineraries.map((itinerary) => (
              <button
                key={itinerary.day}
                className={`day-nav-btn ${currentDay === itinerary.day ? 'active' : ''}`}
                onClick={() => setCurrentDay(itinerary.day)}
              >
                Day {itinerary.day}
              </button>
            ))}
          </div>
        </div>

        <div className="itinerary-layout">
          {/* Daily Schedule Panel */}
          <div className="recommendations-panel">
            <div className="recommendations-header">
              <h3>📋 Day {currentDay} Schedule</h3>
              <div className="trip-summary">
                <span className="summary-item">🏨 {selectedHotel.properties?.name}</span>
                <span className="summary-item">👥 {tripType}</span>
                <span className="summary-item">📅 Day {currentDay} of {days}</span>
              </div>
            </div>

            <div className="daily-schedule">
              {currentDayActivities.map((activity, index) => (
                <div key={index} className="schedule-item">
                  <div className="schedule-time">{activity.time}</div>
                  <div className="schedule-content">
                    <div className="schedule-activity">
                      <span className="activity-icon">
                        {activity.type === 'hotel' && '🏨'}
                        {activity.type === 'museum' && '🏛️'}
                        {activity.type === 'restaurant' && '🍴'}
                        {activity.type === 'cafe' && '☕'}
                        {activity.type === 'beach' && '🏖️'}
                        {activity.type === 'park' && '🌳'}
                        {activity.type === 'shopping' && '🛍️'}
                        {activity.type === 'historical' && '🏺'}
                        {activity.type === 'attraction' && '🎯'}
                      </span>
                      <div>
                        <h4>{activity.activity}</h4>
                        <p className="activity-description">{activity.description}</p>
                        {activity.transport && (
                          <p className="activity-transport">
                            {activity.transport.includes('walk') ? '🚶‍♂️' : '🚕'} {activity.transport}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="itinerary-tips">
              <h4>💡 Day {currentDay} Tips</h4>
              <ul>
                <li>Carry sunscreen and water for outdoor activities</li>
                <li>Have local currency for taxis and small purchases</li>
                <li>Wear comfortable walking shoes</li>
                {tripType === 'couple' && <li>Perfect day for romantic moments and photos</li>}
              </ul>
            </div>
          </div>

          {/* Map Panel */}
          <div className="map-panel">
            <div className="map-container">
              <MapContainer 
                center={[selectedHotel.geometry.coordinates[1], selectedHotel.geometry.coordinates[0]]} 
                zoom={13} 
                className="itinerary-map"
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {currentDayMarkers.map((marker, index) => (
                  <Marker
                    key={index}
                    position={marker.coords}
                    icon={icons[marker.type]}
                  >
                    <Popup>
                      <strong>
                        {marker.type === 'hotel' && '🏨 '}
                        {marker.type === 'museum' && '🏛️ '}
                        {marker.type === 'restaurant' && '🍴 '}
                        {marker.type === 'cafe' && '☕ '}
                        {marker.type === 'beach' && '🏖️ '}
                        {marker.type === 'park' && '🌳 '}
                        {marker.type === 'shopping' && '🛍️ '}
                        {marker.type === 'historical' && '🏺 '}
                        {marker.data.properties?.name}
                      </strong>
                    </Popup>
                  </Marker>
                ))}

                <FitBounds markers={currentDayMarkers.map(marker => ({ coords: marker.coords }))} />
              </MapContainer>
            </div>

            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-color hotel"></div>
                <span>Your Hotel</span>
              </div>
              <div className="legend-item">
                <div className="legend-color museum"></div>
                <span>Museums</span>
              </div>
              <div className="legend-item">
                <div className="legend-color restaurant"></div>
                <span>Restaurants</span>
              </div>
              <div className="legend-item">
                <div className="legend-color cafe"></div>
                <span>Cafes</span>
              </div>
              <div className="legend-item">
                <div className="legend-color beach"></div>
                <span>Beaches</span>
              </div>
              <div className="legend-item">
                <div className="legend-color park"></div>
                <span>Parks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Options */}
        <div className="print-options">
          <button className="print-btn" onClick={printAllDays}>
            📋 Print The Full Itinerary!
          </button>
        </div>

        <div className="step-actions">
          <button className="back-button" onClick={() => setStep(2)}>← Change Hotel</button>
        </div>
      </div>
    );
  };

  // ... all your App component code ...
  // ... (end of renderStep3 function)

// ========== ADD STEP 4 FUNCTION HERE ==========
// ========== UPDATED STEP 4 FUNCTION ==========
const renderStep4 = () => {
  const regionData = getSpecialRegionContent(selectedHotel);
  
  return (
    <div className="special-region-container">
      <div className="step-header">
        <h2>{regionData.title}</h2>
        <p>Authentic experiences beyond typical tourism</p>
      </div>

      <div className="region-content">
        <div className="region-description">
          <p>{regionData.description}</p>
        </div>

        <div className="activities-section">
          <h3>🎯 Recommended Experiences</h3>
          <div className="activities-grid">
            {regionData.activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-bullet">•</span>
                {activity}
              </div>
            ))}
          </div>
        </div>

        <div className="experts-connect">
          <h3>🤝 Connect with Local Experts</h3>
          <p>Our partners in this region can provide personalized guidance and authentic experiences.</p>
          <button 
            className="expert-connect-btn"
            onClick={() => window.open(regionData.link, '_blank')}
          >
            Contact {regionData.title.split(' ')[1]} Experts
          </button>
        </div>
      </div>

      <div className="step-actions">
        <button className="back-button" onClick={() => setStep(2)}>
          ← Back to Hotel Selection
        </button>
      </div>
    </div>
  );
};
// ========== END OF UPDATED STEP 4 FUNCTION ==========

  return (
    <div className="app">
      <div className="app-header">
        <h1>🇹🇳 Tunisia Travel Magic</h1>
        <p>Your personalized journey through Tunisia's wonders</p>
      </div>

      <div className="app-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      <div className="app-footer">
        <p>Made with ❤️ for Tunisia explorers</p>
      </div>
    </div>
  );
} // <-- This closes the App function

// ========== MAKE SURE THIS LINE IS AT THE VERY END ==========
export default App;