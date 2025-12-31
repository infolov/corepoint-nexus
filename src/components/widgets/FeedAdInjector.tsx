import { useMemo } from "react";
import { AuctionAdSlot } from "@/components/widgets/AuctionAdSlot";
import { cn } from "@/lib/utils";

interface FeedAdInjectorProps {
  items: React.ReactNode[];
  adEveryN?: number;  // Insert ad every N items
  placementVariant?: "horizontal" | "square" | "vertical";
  className?: string;
  adClassName?: string;
  showDevOverlay?: boolean;
}

/**
 * Component that injects auction-based ads into a feed of items
 * Ads are inserted every N items using the hybrid auction engine
 */
export function FeedAdInjector({
  items,
  adEveryN = 5,
  placementVariant = "horizontal",
  className,
  adClassName,
  showDevOverlay = true,
}: FeedAdInjectorProps) {
  // Build the feed with ads injected
  const feedWithAds = useMemo(() => {
    if (!items || items.length === 0) return [];

    const result: React.ReactNode[] = [];
    let adSlotIndex = 0;

    items.forEach((item, index) => {
      result.push(item);

      // Insert ad after every N items
      if ((index + 1) % adEveryN === 0) {
        adSlotIndex++;
        result.push(
          <div key={`ad-slot-${adSlotIndex}`} className={cn("py-2", adClassName)}>
            <AuctionAdSlot
              variant={placementVariant}
              slotIndex={adSlotIndex}
              showDevOverlay={showDevOverlay}
              className="w-full"
            />
          </div>
        );
      }
    });

    return result;
  }, [items, adEveryN, placementVariant, adClassName, showDevOverlay]);

  return <div className={className}>{feedWithAds}</div>;
}

/**
 * Utility function to inject ads into an array of items
 * Returns mixed array of items and ad slot configs
 */
export interface FeedItem {
  type: 'content' | 'ad';
  content?: React.ReactNode;
  adSlotIndex?: number;
}

export function createFeedWithAdSlots(
  items: React.ReactNode[],
  adEveryN: number = 5
): FeedItem[] {
  if (!items || items.length === 0) return [];

  const result: FeedItem[] = [];
  let adSlotIndex = 0;

  items.forEach((item, index) => {
    result.push({ type: 'content', content: item });

    if ((index + 1) % adEveryN === 0) {
      adSlotIndex++;
      result.push({ type: 'ad', adSlotIndex });
    }
  });

  return result;
}
