"""
Risk Classification Ensemble Model
Combines Random Forest + XGBoost for robust predictions
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
from pathlib import Path
from typing import Dict, Tuple
import json

from app.ml.feature_engineering import (
    prepare_features, create_risk_labels, CORE_FEATURES, RISK_SCALER_PATH
)

MODEL_PATH = Path(__file__).parent / "models" / "risk_classifier.pkl"
METRICS_PATH = Path(__file__).parent / "models" / "risk_classifier_metrics.json"


def train_risk_classifier(df: pd.DataFrame, verbose: bool = True) -> Tuple[VotingClassifier, dict]:
    """
    Train ensemble risk classifier on environmental data
    """
    if verbose:
        print("=" * 60)
        print("TRAINING RISK CLASSIFICATION MODEL")
        print("=" * 60)
    
    # Create labels
    y = create_risk_labels(df)
    
    # Remove rows with missing target
    valid_idx = ~y.isna()
    df_clean = df[valid_idx].copy()
    y_clean = y[valid_idx].copy()
    
    if verbose:
        print(f"✅ Dataset: {len(df_clean)} samples (removed {(~valid_idx).sum()} with missing AQI)")
        print(f"   Class distribution:")
        for i, label in enumerate(['Low', 'Medium', 'High', 'Critical']):
            count = (y_clean == i).sum()
            pct = count / len(y_clean) * 100
            print(f"      {label:8s}: {count:5d} samples ({pct:5.1f}%)")
    
    # Prepare features
    X, scaler = prepare_features(df_clean, CORE_FEATURES, fit_scaler=True, scaler_path=RISK_SCALER_PATH)
    
    if verbose:
        print(f"✅ Features: {X.shape[1]} features prepared and scaled")
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_clean, test_size=0.2, random_state=42, stratify=y_clean
    )
    
    if verbose:
        print(f"✅ Split: {len(X_train)} training, {len(X_test)} testing")
    
    # Model 1: Random Forest
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=20,
        min_samples_leaf=10,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    
    # Model 2: XGBoost
    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        objective='multi:softmax',
        num_class=4,
        random_state=42,
        n_jobs=-1,
        eval_metric='mlogloss'
    )
    
    # Ensemble: Soft voting
    ensemble = VotingClassifier(
        estimators=[
            ('random_forest', rf_model),
            ('xgboost', xgb_model)
        ],
        voting='soft',
        n_jobs=-1
    )
    
    if verbose:
        print("\n🚀 Training ensemble (Random Forest + XGBoost)...")
    
    # Train ensemble
    ensemble.fit(X_train, y_train)
    
    if verbose:
        print("✅ Training complete!")
    
    # Evaluate
    y_pred = ensemble.predict(X_test)
    y_proba = ensemble.predict_proba(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    conf_matrix = confusion_matrix(y_test, y_pred)
    class_report = classification_report(
        y_test, y_pred,
        target_names=['Low', 'Medium', 'High', 'Critical'],
        output_dict=True
    )
    
    # Cross-validation
    cv_scores = cross_val_score(ensemble, X_train, y_train, cv=5, scoring='accuracy')
    
    if verbose:
        print("\n" + "=" * 60)
        print("MODEL PERFORMANCE METRICS")
        print("=" * 60)
        print(f"Test Accuracy:  {accuracy:.2%}")
        print(f"CV Accuracy:    {cv_scores.mean():.2%} (+/- {cv_scores.std() * 2:.2%})")
        print("\nConfusion Matrix:")
        print("                Predicted")
        print("             Low  Med High Crit")
        for i, label in enumerate(['Low', 'Med', 'High', 'Crit']):
            print(f"Actual {label:4s} {conf_matrix[i]}")
        print("\nPer-Class Metrics:")
        for label in ['Low', 'Medium', 'High', 'Critical']:
            metrics = class_report[label]
            print(f"  {label:8s}: Precision={metrics['precision']:.2%}, "
                  f"Recall={metrics['recall']:.2%}, F1={metrics['f1-score']:.2%}")
    
    # Feature importance (from fitted Random Forest in ensemble)
    rf_fitted = ensemble.named_estimators_['random_forest']
    rf_importances = rf_fitted.feature_importances_
    feature_importance = {
        CORE_FEATURES[i]: float(rf_importances[i])
        for i in range(len(CORE_FEATURES))
    }
    
    sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    
    if verbose:
        print("\nTop 10 Most Important Features:")
        for feature, importance in sorted_features[:10]:
            print(f"  {feature:30s}: {importance:.4f}")
    
    # Save model
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(ensemble, MODEL_PATH)
    
    if verbose:
        print(f"\n✅ Model saved to: {MODEL_PATH}")
    
    # Save metrics
    metrics = {
        'accuracy': float(accuracy),
        'cv_accuracy_mean': float(cv_scores.mean()),
        'cv_accuracy_std': float(cv_scores.std()),
        'confusion_matrix': conf_matrix.tolist(),
        'classification_report': class_report,
        'feature_importance': dict(sorted_features),
        'n_samples_train': len(X_train),
        'n_samples_test': len(X_test),
        'n_features': X.shape[1]
    }
    
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    if verbose:
        print(f"✅ Metrics saved to: {METRICS_PATH}")
        print("=" * 60)
    
    return ensemble, metrics


def load_risk_classifier():
    """Load pre-trained risk classifier"""
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    else:
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run training first: "
            f"python backend/scripts/train_all_models.py"
        )


def predict_risk(features: dict) -> dict:
    """
    Predict risk level from environmental features
    """
    model = load_risk_classifier()
    
    # Convert dict to DataFrame
    df_single = pd.DataFrame([features])
    
    # Prepare features
    scaler = joblib.load(RISK_SCALER_PATH)
    X, _ = prepare_features(df_single, CORE_FEATURES, fit_scaler=False, scaler=scaler, scaler_path=RISK_SCALER_PATH)
    
    # Predict
    risk_score = int(model.predict(X)[0])
    probabilities = model.predict_proba(X)[0]
    
    risk_labels = ['Low', 'Medium', 'High', 'Critical']
    risk_level = risk_labels[risk_score]
    confidence = float(probabilities[risk_score])
    
    prob_dict = {
        risk_labels[i]: float(probabilities[i])
        for i in range(len(risk_labels))
    }
    
    return {
        'risk_level': risk_level,
        'risk_score': risk_score,
        'confidence': confidence,
        'probabilities': prob_dict,
        'model': 'Random Forest + XGBoost Ensemble',
        'n_features_used': len(CORE_FEATURES)
    }


def get_model_info() -> dict:
    """Return model metadata and performance metrics"""
    if not MODEL_PATH.exists():
        return {'error': 'Model not trained yet'}
    
    if METRICS_PATH.exists():
        with open(METRICS_PATH, 'r') as f:
            metrics = json.load(f)
        return {
            'model_type': 'Random Forest + XGBoost Ensemble',
            'accuracy': metrics['accuracy'],
            'cv_accuracy': f"{metrics['cv_accuracy_mean']:.2%} (+/- {metrics['cv_accuracy_std']*2:.2%})",
            'n_samples_train': metrics['n_samples_train'],
            'n_samples_test': metrics['n_samples_test'],
            'n_features': metrics['n_features'],
            'top_features': list(metrics['feature_importance'].keys())[:10]
        }
    else:
        return {'model_type': 'Random Forest + XGBoost Ensemble', 'status': 'Trained but metrics unavailable'}
