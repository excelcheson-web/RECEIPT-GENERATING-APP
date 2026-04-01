import React from 'react';
import { TrackingTimeline, TrackingEvent } from './TrackingTimeline';
import { normalizeWaybill } from '@/lib/waybillNormalization';
import type { StoredWaybill } from '@/lib/types';

interface TrackingResultProps {
  waybill: StoredWaybill;
}

export const TrackingResult: React.FC<TrackingResultProps & { layout?: 'horizontal' | 'vertical' }> = ({ waybill }) => {
  if (!waybill) return null;

  const data = normalizeWaybill(waybill);
  const statusLower = data.currentStatus.toLowerCase();
  const statusClass = statusLower.includes('delivered')
    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
    : statusLower.includes('transit') || statusLower.includes('dispatched')
    ? 'bg-blue-100 text-blue-700 border-blue-300'
    : 'bg-lime-100 text-lime-700 border-lime-300';

  const renderField = (label: string, value: string | number | null) => (
    <div className="text-sm text-[#d6e3f4] grid grid-cols-[170px_1fr] gap-2">
      <span className="font-semibold text-[#9ec4ef]">{label}</span>
      <span>{value === null || value === '' ? 'Not available' : String(value)}</span>
    </div>
  );

  const additionalEntries = Object.entries(data.additionalFields);
  const fromLocation = data.origin;
  const toLocation = data.destination;
  const cargoLocation = data.currentLocation;
  const hasRoute = fromLocation !== 'Not available' && toLocation !== 'Not available';
  const routeMapUrl = hasRoute
    ? `https://maps.google.com/maps?saddr=${encodeURIComponent(fromLocation)}&daddr=${encodeURIComponent(toLocation)}&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(cargoLocation !== 'Not available' ? cargoLocation : fromLocation)}&output=embed`;

  return (
    <div className="tracking-result space-y-6">
      <div className="rounded-2xl shadow-xl p-5 sm:p-6 border border-[#3d587f] bg-[#102744]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-white">Shipment Tracking Summary</h2>
          <span className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-semibold ${statusClass}`}>
            {data.currentStatus}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {renderField('Tracking Number', data.trackingNumber)}
          {renderField('Waybill Number', data.waybillNumber)}
          {renderField('Current Status', data.currentStatus)}
          {renderField('Current Location', data.currentLocation)}
          {renderField('Booking Date', data.bookingDate)}
          {renderField('Estimated Delivery Date', data.estimatedDeliveryDate)}
          {renderField('Delivered Date', data.deliveredDate)}
          {renderField('Shipment Mode', data.shipmentMode)}
          {renderField('Service Type', data.serviceType)}
          {renderField('Payment Status', data.paymentStatus)}
          {renderField('Last Updated', data.lastUpdated)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl shadow-lg p-5 border border-[#3d587f] bg-[#143153]">
          <h3 className="text-lg font-bold text-white mb-3">Sender / Shipper Details</h3>
          <div className="space-y-2">
            {renderField('Sender Name', data.senderName)}
            {renderField('Sender Phone', data.senderPhone)}
            {renderField('Sender Address', data.senderAddress)}
            {renderField('Shipper Name', data.shipperName)}
            {renderField('From (Origin / Port of Departure)', data.origin)}
          </div>
        </div>

        <div className="rounded-2xl shadow-lg p-5 border border-[#3d587f] bg-[#143153]">
          <h3 className="text-lg font-bold text-white mb-3">Receiver / Consignee Details</h3>
          <div className="space-y-2">
            {renderField('Receiver Name', data.receiverName)}
            {renderField('Receiver Phone', data.receiverPhone)}
            {renderField('Receiver Address', data.receiverAddress)}
            {renderField('Consignee Name', data.consigneeName)}
            {renderField('To (Destination / Port of Destination)', data.destination)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-lg p-5 border border-[#3d587f] bg-[#143153]">
        <h3 className="text-lg font-bold text-white mb-3">Shipment Route & Cargo Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {renderField('From', fromLocation)}
          {renderField('To', toLocation)}
          {renderField('Current Cargo Location', cargoLocation)}
        </div>
        <div className="rounded-xl overflow-hidden border border-[#3d587f] bg-[#102744]">
          <iframe
            title="Shipment route map"
            src={routeMapUrl}
            className="w-full"
            style={{ height: '360px' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="rounded-2xl shadow-lg p-5 border border-[#3d587f] bg-[#143153]">
        <h3 className="text-lg font-bold text-white mb-3">Parcel / Cargo Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {renderField('Parcel Description', data.parcelDescription)}
          {renderField('Cargo Description', data.cargoDescription)}
          {renderField('Package Description', data.packageDescription)}
          {renderField('Quantity / Pieces', data.quantity ?? data.totalPieces)}
          {renderField('Weight', data.weight ?? data.totalWeight)}
          {renderField('Dimensions', data.dimensions)}
          {renderField('Special Instructions', data.specialInstructions)}
        </div>
      </div>

      <div className="rounded-2xl shadow-lg p-5 border border-[#3d587f] bg-[#143153]">
        <h3 className="text-lg font-bold text-white mb-3">Additional Waybill Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          {renderField('Date of Issue', data.dateOfIssue)}
          {renderField('Estimated Arrival Date', data.estimatedArrivalDate)}
          {renderField('Total Pieces', data.totalPieces)}
          {renderField('Total Weight', data.totalWeight)}
          {renderField('Route Number', data.routeNumber)}
        </div>

        {additionalEntries.length > 0 && (
          <div className="mt-4 border-t border-[#2d496d] pt-4">
            <div className="font-semibold text-[#9ec4ef] mb-3 tracking-wide">OTHER DETAILS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {additionalEntries.map(([key, value]) => (
                <div key={key} className="text-sm text-[#d6e3f4] grid grid-cols-[150px_1fr] gap-2 rounded-md bg-[#102744]/60 px-3 py-2">
                  <span className="font-semibold text-[#9ec4ef] wrap-break-word">{key}</span>
                  <span className="wrap-break-word">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TrackingTimeline events={data.trackingEvents as TrackingEvent[]} currentStatus={data.currentStatus} />
    </div>
  );
};
