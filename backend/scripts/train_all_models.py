#!/usr/bin/env python3
"""
Train all ML models on environmental dataset
Usage (from the backend folder): python scripts/train_all_models.py
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services import load_data
from app.ml.risk_classifier import train_risk_classifier
from app.ml.anomaly_detector import train_anomaly_detector

def main():
    print("\n" + "=" * 70)
    print("  ENVIROWATCH AI — ML MODEL TRAINING PIPELINE")
    print("=" * 70 + "\n")
    
    # Load dataset
    print("📂 Loading dataset...")
    df = load_data()
    print(f"✅ Loaded {len(df)} rows, {len(df.columns)} columns\n")
    
    # Train risk classifier
    print("\n🎯 STEP 1: Training Risk Classification Model\n")
    risk_model, risk_metrics = train_risk_classifier(df, verbose=True)
    
    # Train anomaly detector
    print("\n🔍 STEP 2: Training Anomaly Detection Model\n")
    anomaly_model = train_anomaly_detector(df, contamination=0.05, verbose=True)
    
    # Summary
    print("\n" + "=" * 70)
    print("  TRAINING COMPLETE — SUMMARY")
    print("=" * 70)
    print(f"✅ Risk Forecaster balanced accuracy: {risk_metrics['model']['balanced_accuracy']:.2%} "
          f"(baseline {risk_metrics['baseline_last_hour']['balanced_accuracy']:.2%})")
    print(f"✅ Models saved in: backend/app/ml/models/")
    print("\nYou can now use the models via:")
    print("  - API: http://localhost:8000/api/ml/predict-risk")
    print("  - Python: from app.ml.risk_classifier import predict_risk")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    main()
