export interface LumaEvent {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  cover_url: string;
  url: string;
  organizer: {
    name: string;
    avatar_url?: string;
  };
  price?: {
    amount: number;
    currency: string;
    display: string;
  };
}

// Example response structure for reference
const EXAMPLE_RESPONSE = [
  {
    "event": {
      "api_id": "evt-ILGr6w8M4PQtrCH",
      "name": "Engineering Night #5",
      "start_at": "2025-07-16T01:00:00.000Z",
      "end_at": "2025-07-16T04:00:00.000Z",
      "cover_url": "https://images.lumacdn.com/event-covers/je/ed20208d-9576-4e38-abbb-821f19f4ac69.jpg",
      "url": "jz7hwme0"
    },
    "calendar": {
      "name": "Dust",
      "avatar_url": "https://images.lumacdn.com/calendars/8p/a5aa2e0f-838c-4239-8e51-20f04f1d7797.png"
    },
    "hosts": [
      {
        "name": "kev",
        "avatar_url": "https://images.lumacdn.com/avatars/h0/5984c309-66cb-4240-857e-5cd02b3a4d08"
      }
    ],
    "ticket_info": {
      "is_free": true
    },
    "geo_address_info": {
      "city_state": "San Francisco, California"
    },
    "coordinate": {
      "latitude": 37.7825,
      "longitude": -122.4075
    }
  }
];

export const fetchLumaEvents = async (): Promise<LumaEvent[]> => {
  try {
    console.log('Fetching Lu.ma events...');
    const response = await fetch(
      'https://api.lu.ma/discover/get-paginated-events?discover_place_api_id=discplace-BDj7GNbGlsF7Cka&pagination_limit=25',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0',
          'Accept': '*/*',
          'Accept-Language': 'en',
          'x-luma-web-url': 'https://lu.ma/sf',
          'x-luma-previous-path': '/discover',
          'x-luma-client-type': 'luma-web',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lu.ma API error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`Lu.ma API error: ${response.status} ${response.statusText}`);
    }

    // Handle the response as text first to debug the actual structure
    const responseText = await response.text();
    console.log('Raw Lu.ma API response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed Lu.ma API response:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Error parsing Lu.ma API response:', parseError);
      console.log('Raw response text:', responseText);
      throw new Error('Failed to parse Lu.ma API response');
    }

    // Check if data is an array or has a data property that's an array
    let events = [];
    if (Array.isArray(data)) {
      events = data;
      console.log('Found events in root array');
    } else if (data?.data && Array.isArray(data.data)) {
      events = data.data;
      console.log('Found events in data.data');
    } else if (data?.entries && Array.isArray(data.entries)) {
      events = data.entries;
      console.log('Found events in data.entries');
    } else {
      console.warn('No events array found in response. Full response:', JSON.stringify(data, null, 2));
      return [];
    }
    
    console.log(`Found ${events.length} events`);
    
    const mappedEvents = events.map((item: any, index: number) => {
      console.log(`Processing event ${index + 1}/${events.length}`, JSON.stringify(item, null, 2));
      // Handle case where item might be the event directly or have an event property
      const event = item.event || item;
      const calendar = item.calendar || {};
      const primaryHost = (item.hosts?.[0] || {}) as any;
      
      // Extract location information
      const locationInfo = event.geo_address_info || {};
      const locationName = locationInfo.city_state || 'TBD';
      const locationAddress = locationInfo.full_address || locationName;
      
      // Extract ticket info
      const ticketInfo = item.ticket_info || {};
      const isFree = ticketInfo.is_free || false;
      
      // Build the event object
      return {
        id: event.api_id || event.id || '',
        name: event.name || 'Untitled Event',
        description: event.description_short || calendar.description_short || '',
        start_date: event.start_at || event.start_date || new Date().toISOString(),
        end_date: event.end_at || event.end_date || new Date().toISOString(),
        location: {
          name: locationName,
          address: locationAddress,
          lat: event.coordinate?.latitude || event.lat,
          lng: event.coordinate?.longitude || event.lng,
        },
        cover_url: event.cover_url || event.image_url || calendar.cover_image_url || '',
        url: event.url ? `https://lu.ma/${event.url}` : 'https://lu.ma',
        organizer: {
          name: primaryHost.name || calendar.name || 'Unknown Organizer',
          avatar_url: primaryHost.avatar_url || calendar.avatar_url || '',
        },
        price: isFree
          ? { amount: 0, currency: 'USD', display: 'Free' }
          : {
              amount: ticketInfo.price || 0,
              currency: ticketInfo.currency_info?.currency || 'USD',
              display: ticketInfo.price 
                ? `$${ticketInfo.price}` 
                : 'Free',
            },
      };
    });
    
    console.log('Mapped events:', JSON.stringify(mappedEvents, null, 2));
    return mappedEvents;
  } catch (error) {
    console.error('Error fetching Lu.ma events:', error);
    return [];
  }
};
