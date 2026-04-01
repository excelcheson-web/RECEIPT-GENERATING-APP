
import mongoose from 'mongoose';

const WaybillSchema = new mongoose.Schema({
  waybillNumber: { type: String, required: true, unique: true },
  senderName: { type: String, required: true },
  senderPhone: { type: String, required: true },
  senderAddress: { type: String, required: true },
  receiverName: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  receiverAddress: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  shipmentMode: { type: String, required: true },
  serviceType: { type: String, required: true },
  parcelDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  weight: { type: Number, required: true },
  dimensions: { type: String, required: true },
  currentStatus: { type: String, required: true },
  currentLocation: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  estimatedDeliveryDate: { type: Date, required: true },
  deliveredDate: { type: Date },
  paymentStatus: { type: String, required: true },
  specialInstructions: { type: String },
  trackingEvents: [
    {
      status: { type: String, required: true },
      location: { type: String, required: true },
      description: { type: String, required: true },
      eventTime: { type: Date, required: true },
    },
  ],
});

export default mongoose.models.Waybill || mongoose.model('Waybill', WaybillSchema);
