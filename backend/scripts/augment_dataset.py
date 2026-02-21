#!/usr/bin/env python3
"""
Dataset Augmentation Script for EnviroWatch AI
Adds 4 new columns: wind_speed_kmh, rainfall_mm_24h, traffic_density, industrial_proximity_km
"""
import pandas as pd
import numpy as np
import sys
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

def augment_dataset():
    dataset_path = Path(__file__).parent.parent / 'data' / 'pune_mumbai_environmental_data_17022026.csv'
    
    if not dataset_path.exists():
        print(f"❌ Dataset not found at {dataset_path}")
        sys.exit(1)
    
    print(f"📊 Loading dataset from {dataset_path}")
    df = pd.read_csv(dataset_path, index_col=0)
    print(f"✅ Loaded {len(df)} rows × {len(df.columns)} columns")
    
    # Check if columns already exist
    new_cols = ['wind_speed_kmh', 'rainfall_mm_24h', 'traffic_density', 'industrial_proximity_km']
    existing = [col for col in new_cols if col in df.columns]
    if existing:
        print(f"⚠️  Columns already exist: {existing}")
        response = input("Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            return
    
    print("\n🔧 Generating new columns...")
    
    # 1. Wind Speed (km/h) - coastal higher, midday higher
    def calculate_wind_speed(row):
        is_coastal = 'Coastal' in str(row.get('zone_type', ''))
        base = 18 if is_coastal else 12
        
        # Hour factor (higher during midday)
        hour = row.get('hour', 12)
        hour_factor = 1.3 if 12 <= hour <= 18 else 0.9
        
        # Add randomness
        wind = base * hour_factor * np.random.uniform(0.7, 1.3)
        return round(wind, 1)
    
    df['wind_speed_kmh'] = df.apply(calculate_wind_speed, axis=1)
    print("✅ Added wind_speed_kmh")
    
    # 2. Rainfall (mm in last 24h) - Feb is dry, occasional spikes
    def calculate_rainfall(row):
        # 15% chance of rain spike
        if np.random.random() < 0.15:
            return round(np.random.uniform(20, 80), 1)
        else:
            return round(np.random.uniform(0, 5), 1)
    
    df['rainfall_mm_24h'] = df.apply(calculate_rainfall, axis=1)
    print("✅ Added rainfall_mm_24h")
    
    # 3. Traffic Density (0-100) - zone-dependent
    def calculate_traffic_density(row):
        zone_map = {
            'Industrial': 85,
            'Commercial': 75,
            'Residential': 50,
            'IT': 60,
            'Mixed': 65,
            'Coastal': 40,
            'Gated': 35,
            'Slum': 70
        }
        
        zone = str(row.get('zone_type', 'Mixed'))
        base = 55  # default
        
        for key, value in zone_map.items():
            if key in zone:
                base = value
                break
        
        # Add random variation ±15
        traffic = base + np.random.randint(-15, 16)
        return int(np.clip(traffic, 10, 100))
    
    df['traffic_density'] = df.apply(calculate_traffic_density, axis=1)
    print("✅ Added traffic_density")
    
    # 4. Industrial Proximity (km) - location-specific
    def calculate_industrial_proximity(row):
        high_industrial = [
            'Hadapsar', 'Pimpri-Chinchwad', 'Pimpri', 'Chinchwad',
            'Chembur', 'Dharavi', 'Andheri East', 'Kurla', 'Bhosari'
        ]
        
        location = str(row.get('location', ''))
        
        # Check if location is in high industrial areas
        for area in high_industrial:
            if area.lower() in location.lower():
                return round(np.random.uniform(0.3, 1.5), 1)
        
        # Otherwise, farther from industrial zones
        return round(np.random.uniform(2.0, 8.0), 1)
    
    df['industrial_proximity_km'] = df.apply(calculate_industrial_proximity, axis=1)
    print("✅ Added industrial_proximity_km")
    
    # Save augmented dataset
    print(f"\n💾 Saving augmented dataset...")
    df.to_csv(dataset_path)
    
    print(f"\n🎉 SUCCESS!")
    print(f"   Total rows: {len(df)}")
    print(f"   Total columns: {len(df.columns)}")
    print(f"   New columns: {new_cols}")
    print(f"\n📊 Sample statistics:")
    print(df[new_cols].describe())

if __name__ == '__main__':
    augment_dataset()
