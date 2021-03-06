package com.notepad.serviceImpl;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.notepad.dto.ItemDTO;
import com.notepad.entity.Item;
import com.notepad.entity.Menu;
import com.notepad.entity.User;
import com.notepad.error.BadRequestAlertException;
import com.notepad.mapper.ItemMapper;
import com.notepad.repository.ItemRepository;
import com.notepad.repository.MenuRepository;
import com.notepad.repository.UserRepository;
import com.notepad.service.ItemService;

@Service
public class ItemServiceImpl implements ItemService {

	private final Logger log = LoggerFactory.getLogger(ItemServiceImpl.class);

	@Autowired
	private ItemRepository itemRepository;

	@Autowired
	private ItemMapper itemMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private MenuRepository menuRepository;

	/**
	 * to save a new item
	 *
	 * @param itemDTO : the itemDTO to create.
	 * @return the persisted entity.
	 * 
	 */
	@Override
	public ItemDTO save(ItemDTO itemDTO, Principal principal) {
		log.info("Request to create item : {} ", itemDTO);

		// to create item

		if (itemDTO.getItemId() == null) {
			User user = userRepository.findByUserName(principal.getName());
			if (user != null) {
				// set user to item
				itemDTO.setuId(user.getUserId());
				itemDTO.setUserName(user.getUserName());
			}

			if (itemDTO.getpId() == null && itemDTO.getContent() == null) {
				throw new BadRequestAlertException("Content and parentId must not be null", "Item", null);
			}

			// set zIndex

			if (itemDTO.getZindex() != null) { // check if zIndex presents in requestBody
				// if yes, then do relevant changes

				List<Item> items = new ArrayList<>();

				// 1) get Items by the pId of item to be stored --> sortedByZIndex

				Long pId = itemDTO.getpId();

				// get all items with pId
				Optional<Menu> parentMenu = menuRepository.findById(pId);
				if (parentMenu != null) {
					items = itemRepository.findAllByMenuOrderByZindex(parentMenu.get());
				}

				if (!items.isEmpty()) {

					for (Item existingItem : items) {
						if (existingItem.getZindex() < itemDTO.getZindex()) {
							// 1.2) if Items (sortedByZIndex) exist, then iterate until items'
							// existingItemZIndex < newItemZIndex
							continue;
						} else {
							// 1.2.1) then make zIndex+1 for remaining Items
							existingItem.setZindex(existingItem.getZindex() + 1);
						}
					}

					// 1.2.2) setNewItemZIndex as per requestBody
					itemDTO.setZindex(itemDTO.getZindex());

				}

			} else { // if not then to assign last zIndex --> follow the steps below!

				List<Item> items = new ArrayList<>();

				// 1) get Items by the pId of item to be stored

				Long pId = itemDTO.getpId();

				// get all items with pId
				Optional<Menu> parentMenu = menuRepository.findById(pId);
				if (parentMenu != null) {
					items = itemRepository.findAllByMenuOrderByZindex(parentMenu.get());
				}

				if (items.isEmpty()) {
					// 1.1) if Items do not exist, then set the first zIndex as 0
					itemDTO.setZindex(0);
				} else {
					// 1.2) if exists, then get item with maxZIndex
					Item lastIndexedItem = items.get(items.size() - 1);

					// 1.2.1) set maxZIndex+1 to the zIndex of item to be stored
					itemDTO.setZindex(lastIndexedItem.getZindex() + 1);
				}

			}

			Item item = itemRepository.save(itemMapper.toEntity(itemDTO));
			return itemMapper.toDTO(item);

		} else { // to update item

			Optional<Item> item = itemRepository.findById(itemDTO.getItemId());
			item.ifPresent(existingItem -> {
				if (itemDTO.getContent() != null) {
					existingItem.setContent(itemDTO.getContent());
				}

				// TODO : to update pId of item
				
				if (existingItem.getMenu().getMenuId() != itemDTO.getpId()) {
					
					
					// update z-indices in item's old parent Menu!
					
//					List<Item> oldItems = new ArrayList<>();
//					
//					Long oldPId = existingItem.getMenu().getMenuId();
//					
//					// get all items with old-pId
//					Optional<Menu> oldParentMenu = menuRepository.findById(oldPId);
//					if (oldParentMenu != null) {
//						oldItems = itemRepository.findAllByMenuOrderByZindex(oldParentMenu.get());
//					}
//					if (oldItems.size() > 1) {
//						for (Item existingItem1 : oldItems) {
//							if (existingItem1.getItemId() == existingItem.getItemId()
//									&& existingItem1.getItemId().equals(existingItem.getItemId())) {
//								continue;
//							}
//							if (existingItem1.getZindex() < existingItem.getZindex()) {
//								continue;
//							} else {
//								existingItem1.setZindex(existingItem1.getZindex() - 1);
//							}
//						}
//					}
					
					
					
					// get MenuBy menuDTO.getpId()
					
					Optional<Menu> menuOp = menuRepository.findById(itemDTO.getpId());
					if (menuOp.isPresent()) {
						// set this menu to existing item
						existingItem.setMenu(menuOp.get());
					}
					
					
					// set last index as z-index to this item
					
					List<Item> items = new ArrayList<>();

					// 1) get Items by the pId of item to be stored

					Long pId = itemDTO.getpId();

					// get all items with pId
					Optional<Menu> parentMenu = menuRepository.findById(pId);
					if (parentMenu != null) {
						items = itemRepository.findAllByMenuOrderByZindex(parentMenu.get());
					}

					if (items.isEmpty()) {
						// 1.1) if Items do not exist, then set the first zIndex as 0
						existingItem.setZindex(0);
					} else {
						// 1.2) if exists, then get item with maxZIndex
						Item lastIndexedItem = items.get(items.size() - 1);

						// 1.2.1) set maxZIndex+1 to the zIndex of item to be stored
						existingItem.setZindex(lastIndexedItem.getZindex() + 1);
					}
					
				}
				
				// to update z-index

				if (itemDTO.getZindex() != null) { // check if zIndex presents in requestBody
					// if yes, then do relevant changes

					List<Item> items = new ArrayList<>();

					// 1) get Items by the pId of item to be stored --> sortedByZIndex

					Long pId = itemDTO.getpId();

					// get all items with pId
					Optional<Menu> parentMenu = menuRepository.findById(pId);
					if (parentMenu != null) {
						items = itemRepository.findAllByMenuOrderByZindex(parentMenu.get());
					}

					if (items.isEmpty()) {
						// 1.1) if items do not exist, then set the first orderId as per requestBody
						existingItem.setZindex(itemDTO.getZindex());
					}
					if (!items.isEmpty()) {

						for (Item existingItem1 : items) {
							if (existingItem1.getItemId().equals(itemDTO.getItemId())
									&& existingItem1.getItemId() == itemDTO.getItemId()) {
								// skip for item itself
								continue;
							}
							if (existingItem1.getZindex() < itemDTO.getZindex()) {
								// 1.2) if Items (sortedByZIndex) exist, then iterate until items'
								// existingItemZIndex < newItemZIndex
								continue;
							} else {
								// 1.2.1) then make zIndex+1 for remaining Items
								existingItem1.setZindex(existingItem1.getZindex() + 1);
							}
						}

						// 1.2.2) setNewItemZIndex as per requestBody
						existingItem.setZindex(itemDTO.getZindex());
					}
				}

			});

			Item updatedItem = itemRepository.save(item.get());
			return itemMapper.toDTO(updatedItem);
		}

	}

	/**
	 * Delete the item by id.
	 *
	 * @param itemId the id of the entity.
	 */
	@Override
	public void delete(Long itemId) {
		log.info("Request to delete item with id : {} ", itemId);
		itemRepository.deleteById(itemId);
	}

	/**
	 * Get all the items by menu.
	 *
	 * @param menuId id of menu to which item(s) belong(s)!
	 * @return the list of entities.
	 */
	@Override
	public List<ItemDTO> findAllByMenu(Long menuId) {
		log.info("Request to find all items with menuId : {} ", menuId);
		List<ItemDTO> itemDTOs = new ArrayList<>();
		menuRepository.findById(menuId).ifPresent(menu -> {
			List<Item> items = itemRepository.findAllByMenuOrderByZindex(menu);
			if (!items.isEmpty()) {
				items.forEach(item -> {
					itemDTOs.add(itemMapper.toDTO(item));
				});
			}
		});

		return itemDTOs;
	}

}
