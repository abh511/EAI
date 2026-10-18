"""
Risk Forecasting Ensemble Model
Predicts the average environmental risk level over the next 3 hours
(Random Forest + XGBoost, soft voting).

Why a forecast and not "current risk": the current risk class is defined by the
AQI formula applied to PM2.5, so a model trained on it only re-learns a formula.
The future risk is not known at prediction time, so the model has real work to do.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, classification_report, confusion_matrix, f1_score,
)
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier
import joblib
from pathlib import Path
from typing import Tuple
import json

from app.ml.feature_engineering import (
    FORECAST_FEATURES, FORECAST_HORIZON_MIN, RISK_LABELS,
    aqi_to_risk, build_forecast_frame, forecast_features, pm25_to_aqi,
)

MODEL_PATH = Path(__file__).parent / "models" / "risk_classifier.pkl"
METRICS_PATH = Path(__file__).parent / "models" / "risk_classifier_metrics.json"

TEST_FRACTION = 0.25  # the latest 25% of the timeline is held out for testing


def _build_ensemble() -> VotingClassifier:
    rf_model = RandomForestClassifier(
        n_estimators=300,
        min_samples_leaf=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    xgb_model = XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        eval_metric='mlogloss',
    )
    return VotingClassifier(
        estimators=[('random_forest', rf_model), ('xgboost', xgb_model)],
        voting='soft',
    )


def _scores(y_true, y_pred) -> dict:
    return {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'balanced_accuracy': float(balanced_accuracy_score(y_true, y_pred)),
        'macro_f1': float(f1_score(y_true, y_pred, average='macro')),
    }


def train_risk_classifier(df: pd.DataFrame, verbose: bool = True) -> Tuple[VotingClassifier, dict]:
    """
    Train the 3-hour risk forecaster.

    Evaluation uses a time-based split (train on earlier readings, test on the
    latest ones). A random split would leak information because neighbouring
    readings a few minutes apart are nearly identical.
    """
    if verbose:
        print("=" * 60)
        print(f"TRAINING RISK FORECAST MODEL (next {FORECAST_HORIZON_MIN // 60} hours)")
        print("=" * 60)

    data = build_forecast_frame(df)
    X = data[FORECAST_FEATURES]
    y = data['target_risk']

    if verbose:
        print(f"✅ Dataset: {len(data)} samples with a complete {FORECAST_HORIZON_MIN}-min horizon")
        print("   Target class distribution:")
        for i, label in enumerate(RISK_LABELS):
            count = int((y == i).sum())
            print(f"      {label:8s}: {count:5d} samples ({count / len(y) * 100:5.1f}%)")

    cutoff = data['timestamp'].quantile(1 - TEST_FRACTION)
    train_mask = data['timestamp'] < cutoff
    X_train, y_train = X[train_mask], y[train_mask]
    X_test, y_test = X[~train_mask], y[~train_mask]

    if verbose:
        print(f"✅ Time split at {cutoff:%H:%M}: {len(X_train)} training, {len(X_test)} testing")

    # Balanced sample weights so rare classes are not drowned out by "Medium"
    ensemble = _build_ensemble()
    ensemble.fit(X_train, y_train, sample_weight=compute_sample_weight('balanced', y_train))

    y_pred = ensemble.predict(X_test)
    model_scores = _scores(y_test, y_pred)

    # Baseline the model has to beat: "the next 3 hours look like the last hour"
    baseline_pred = X_test['aqi_past60'].apply(aqi_to_risk)
    baseline_scores = _scores(y_test, baseline_pred)

    present = sorted(set(y_test) | set(y_pred))
    class_report = classification_report(
        y_test, y_pred, labels=present,
        target_names=[RISK_LABELS[i] for i in present],
        output_dict=True, zero_division=0,
    )
    conf_matrix = confusion_matrix(y_test, y_pred, labels=present)

    if verbose:
        print("\n" + "=" * 60)
        print("HELD-OUT PERFORMANCE (latest readings)")
        print("=" * 60)
        print(f"{'':22s}{'Accuracy':>10s}{'Balanced':>10s}{'Macro F1':>10s}")
        for name, sc in [('ML ensemble', model_scores), ('Baseline (last hour)', baseline_scores)]:
            print(f"{name:22s}{sc['accuracy']:10.2%}{sc['balanced_accuracy']:10.2%}{sc['macro_f1']:10.2%}")
        print("\nPer-class metrics:")
        for i in present:
            m = class_report[RISK_LABELS[i]]
            print(f"  {RISK_LABELS[i]:8s}: Precision={m['precision']:.2%}, Recall={m['recall']:.2%}, "
                  f"support={int(m['support'])}")

    rf_importances = ensemble.named_estimators_['random_forest'].feature_importances_
    sorted_features = sorted(
        zip(FORECAST_FEATURES, map(float, rf_importances)), key=lambda x: x[1], reverse=True
    )

    # Refit on all data for deployment, now that it has been evaluated
    final_model = _build_ensemble()
    final_model.fit(X, y, sample_weight=compute_sample_weight('balanced', y))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_model, MODEL_PATH)

    metrics = {
        'task': f'Average risk level over the next {FORECAST_HORIZON_MIN // 60} hours',
        'horizon_minutes': FORECAST_HORIZON_MIN,
        'split': f'time-based, test = readings from {cutoff:%Y-%m-%d %H:%M} onward',
        'model': model_scores,
        'baseline_last_hour': baseline_scores,
        'accuracy': model_scores['accuracy'],
        'confusion_matrix': conf_matrix.tolist(),
        'confusion_matrix_labels': [RISK_LABELS[i] for i in present],
        'classification_report': class_report,
        'classes_seen_in_training': [RISK_LABELS[int(c)] for c in sorted(y.unique())],
        'feature_importance': dict(sorted_features),
        'n_samples_train': int(len(X_train)),
        'n_samples_test': int(len(X_test)),
        'n_features': len(FORECAST_FEATURES),
    }
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)

    if verbose:
        print(f"\n✅ Model saved to: {MODEL_PATH}")
        print(f"✅ Metrics saved to: {METRICS_PATH}")
        print("=" * 60)

    return final_model, metrics


def load_risk_classifier():
    """Load pre-trained risk forecaster"""
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    raise FileNotFoundError(
        f"Model not found at {MODEL_PATH}. Run training first: "
        f"cd backend && python scripts/train_all_models.py"
    )


def predict_risk(reading: dict, history: pd.DataFrame) -> dict:
    """
    Forecast the risk level for the next 3 hours.

    `history` holds this location's readings up to and including `reading`.
    """
    model = load_risk_classifier()
    X = forecast_features(reading, history)

    proba = model.predict_proba(X)[0]
    prob_dict = {label: 0.0 for label in RISK_LABELS}
    for cls, p in zip(model.classes_, proba):
        prob_dict[RISK_LABELS[int(cls)]] = float(p)

    risk_score = int(model.classes_[int(np.argmax(proba))])
    confidence = float(np.max(proba))

    # Current risk straight from the AQI formula; no model needed for "now"
    current_aqi = max(float(reading.get('aqi_us', 0)), pm25_to_aqi(reading.get('pm2_5_ug_m3', 0)))
    current_risk = aqi_to_risk(current_aqi)

    # Safety rule: hazardous air right now is never forecast as anything below
    # Critical. The data has too few Critical periods for the model to learn it.
    safety_override = current_risk == 3 and risk_score < 3
    if safety_override:
        risk_score, confidence = 3, 1.0

    return {
        'risk_level': RISK_LABELS[risk_score],
        'risk_score': risk_score,
        'confidence': confidence,
        'probabilities': prob_dict,
        'model': 'Random Forest + XGBoost Ensemble',
        'n_features_used': len(FORECAST_FEATURES),
        'horizon_hours': FORECAST_HORIZON_MIN // 60,
        'current_aqi': int(round(current_aqi)),
        'current_risk_level': RISK_LABELS[current_risk],
        'safety_override': safety_override,
    }


def get_model_info() -> dict:
    """Return model metadata and performance metrics"""
    if not MODEL_PATH.exists():
        return {'error': 'Model not trained yet'}

    if not METRICS_PATH.exists():
        return {'model_type': 'Random Forest + XGBoost Ensemble', 'status': 'Trained but metrics unavailable'}

    with open(METRICS_PATH, 'r') as f:
        metrics = json.load(f)
    if 'baseline_last_hour' not in metrics:
        return {'model_type': 'Random Forest + XGBoost Ensemble',
                'status': 'Metrics are from an older model version. Retrain the models.'}
    return {
        'model_type': 'Random Forest + XGBoost Ensemble',
        'task': metrics['task'],
        'evaluation': metrics['split'],
        'accuracy': metrics['model']['accuracy'],
        'balanced_accuracy': metrics['model']['balanced_accuracy'],
        'macro_f1': metrics['model']['macro_f1'],
        'baseline_balanced_accuracy': metrics['baseline_last_hour']['balanced_accuracy'],
        'classes_seen_in_training': metrics['classes_seen_in_training'],
        'n_samples_train': metrics['n_samples_train'],
        'n_samples_test': metrics['n_samples_test'],
        'n_features': metrics['n_features'],
        'top_features': list(metrics['feature_importance'].keys())[:10],
        'note': 'Trained on simulated data for Pune and Mumbai (one day of readings).',
    }
