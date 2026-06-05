import restaurantLogo from '../../imports/res.png';
import retailLogo from '../../imports/ret.png';

export function getDefaultStoreLogo(storeType?: string | null) {
  return storeType === 'RETAIL_STORE' ? retailLogo : restaurantLogo;
}
